import httpx
import os
from fastapi import APIRouter, Query, HTTPException
from ..core.auth import get_current_user
from fastapi import Depends
from .. import models

router = APIRouter(prefix="/images", tags=["Images"])

UNSPLASH_KEY = os.getenv("UNSPLASH_ACCESS_KEY")  # free at unsplash.com/developers

@router.get("/search")
async def search_image(
    q: str = Query(..., description="Search query e.g. 'Santorini Greece beach'"),
    _: models.User = Depends(get_current_user),
):
    if not UNSPLASH_KEY:
        raise HTTPException(status_code=503, detail="Unsplash key not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.unsplash.com/search/photos",
            params={"query": q, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
            timeout=8,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Unsplash request failed")

    results = resp.json().get("results", [])
    if not results:
        raise HTTPException(status_code=404, detail="No image found")

    photo = results[0]
    return {
        "url": photo["urls"]["regular"],        # 1080w
        "thumb": photo["urls"]["small"],         # 400w
        "author": photo["user"]["name"],
        "author_link": photo["user"]["links"]["html"],
    }
