from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models
from ..database import get_db
from ..core.auth import get_current_user
from ..schemas import (
    CommunityGroupCreate, CommunityGroupOut,
    CommunityPostCreate, CommunityPostOut,
    PostCommentCreate, PostCommentOut,
    PlaceReviewCreate, PlaceReviewOut,
)

router = APIRouter(prefix="/community", tags=["Community"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _group_out(group: models.CommunityGroup, user_id: int) -> CommunityGroupOut:
    is_member = any(m.user_id == user_id for m in group.memberships)
    data = CommunityGroupOut.model_validate(group)
    data.is_member = is_member
    return data

def _post_out(post: models.CommunityPost) -> CommunityPostOut:
    data = CommunityPostOut.model_validate(post)
    data.author_name = post.author.full_name if post.author else "Anonymous"
    return data

def _review_out(review: models.PlaceReview) -> PlaceReviewOut:
    data = PlaceReviewOut.model_validate(review)
    data.author_name = review.author.full_name if review.author else "Anonymous"
    return data


# ── Groups ────────────────────────────────────────────────────────────────────

@router.get("/groups", response_model=List[CommunityGroupOut])
def list_groups(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.CommunityGroup)
    if category:
        q = q.filter(models.CommunityGroup.category == category)
    groups = q.order_by(models.CommunityGroup.member_count.desc()).all()
    return [_group_out(g, current_user.id) for g in groups]


@router.post("/groups", response_model=CommunityGroupOut, status_code=201)
def create_group(
    payload: CommunityGroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = models.CommunityGroup(**payload.model_dump(), created_by=current_user.id)
    db.add(group)
    db.flush()
    # auto-join creator
    membership = models.GroupMembership(group_id=group.id, user_id=current_user.id)
    group.member_count = 1
    db.add(membership)
    db.commit()
    db.refresh(group)
    return _group_out(group, current_user.id)


@router.post("/groups/{group_id}/join", status_code=200)
def join_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.CommunityGroup).filter_by(id=group_id).first()
    if not group:
        raise HTTPException(404, "Group not found")

    existing = db.query(models.GroupMembership).filter_by(
        group_id=group_id, user_id=current_user.id
    ).first()
    if existing:
        raise HTTPException(400, "Already a member")

    db.add(models.GroupMembership(group_id=group_id, user_id=current_user.id))
    group.member_count = (group.member_count or 0) + 1
    db.commit()
    return {"detail": "Joined"}


@router.delete("/groups/{group_id}/leave", status_code=200)
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    membership = db.query(models.GroupMembership).filter_by(
        group_id=group_id, user_id=current_user.id
    ).first()
    if not membership:
        raise HTTPException(404, "Not a member")

    group = db.query(models.CommunityGroup).filter_by(id=group_id).first()
    db.delete(membership)
    if group and group.member_count > 0:
        group.member_count -= 1
    db.commit()
    return {"detail": "Left group"}


# ── Posts / Reports ───────────────────────────────────────────────────────────

@router.get("/posts", response_model=List[CommunityPostOut])
def list_posts(
    group_id: Optional[int] = Query(None),
    post_type: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.CommunityPost)
    if group_id:
        q = q.filter(models.CommunityPost.group_id == group_id)
    if post_type:
        q = q.filter(models.CommunityPost.post_type == post_type)
    posts = q.order_by(models.CommunityPost.created_at.desc()).limit(limit).all()
    return [_post_out(p) for p in posts]


@router.post("/posts", response_model=CommunityPostOut, status_code=201)
def create_post(
    payload: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = models.CommunityPost(**payload.model_dump(), author_id=current_user.id)
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_out(post)


@router.patch("/posts/{post_id}/resolve", status_code=200)
def resolve_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.CommunityPost).filter_by(id=post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(403, "Not your post")
    post.is_resolved = True
    db.commit()
    return {"detail": "Resolved"}


@router.post("/posts/{post_id}/upvote", status_code=200)
def upvote_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    post = db.query(models.CommunityPost).filter_by(id=post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    post.upvotes = (post.upvotes or 0) + 1
    db.commit()
    return {"upvotes": post.upvotes}


# ── Comments ──────────────────────────────────────────────────────────────────

@router.get("/posts/{post_id}/comments", response_model=List[PostCommentOut])
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    comments = (
        db.query(models.PostComment)
        .filter_by(post_id=post_id)
        .order_by(models.PostComment.created_at.asc())
        .all()
    )
    result = []
    for c in comments:
        d = PostCommentOut.model_validate(c)
        d.author_name = c.author.full_name if c.author else "Anonymous"
        result.append(d)
    return result


@router.post("/posts/{post_id}/comments", response_model=PostCommentOut, status_code=201)
def add_comment(
    post_id: int,
    payload: PostCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.CommunityPost).filter_by(id=post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    comment = models.PostComment(post_id=post_id, author_id=current_user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    d = PostCommentOut.model_validate(comment)
    d.author_name = current_user.full_name
    return d


# ── Place Reviews ─────────────────────────────────────────────────────────────

@router.get("/reviews", response_model=List[PlaceReviewOut])
def list_reviews(
    place_name: Optional[str] = Query(None),
    place_type: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    q = db.query(models.PlaceReview)
    if place_name:
        q = q.filter(models.PlaceReview.place_name.ilike(f"%{place_name}%"))
    if place_type:
        q = q.filter(models.PlaceReview.place_type == place_type)
    reviews = q.order_by(models.PlaceReview.created_at.desc()).limit(limit).all()
    return [_review_out(r) for r in reviews]


@router.post("/reviews", response_model=PlaceReviewOut, status_code=201)
def create_review(
    payload: PlaceReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    review = models.PlaceReview(**payload.model_dump(), user_id=current_user.id)
    db.add(review)
    db.commit()
    db.refresh(review)
    return _review_out(review)


@router.post("/reviews/{review_id}/upvote", status_code=200)
def upvote_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    review = db.query(models.PlaceReview).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    review.upvotes = (review.upvotes or 0) + 1
    db.commit()
    return {"upvotes": review.upvotes}


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    review = db.query(models.PlaceReview).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(403, "Not your review")
    db.delete(review)
    db.commit()
