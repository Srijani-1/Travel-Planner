import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
    Users, Plus, MessageCircle, ThumbsUp, MapPin, AlertTriangle,
    Lightbulb, Star, Shield, X, Send, Loader2,
    CheckCircle2, Globe, Lock, Filter, Trash2, ArrowLeft, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────────────────
type Group = {
    id: number; name: string; description: string;
    category: string; member_count: number; is_public: boolean;
    is_member: boolean; is_owner: boolean;
};
type Post = {
    id: number; group_id: number | null; post_type: string;
    title: string; body: string; location: string | null;
    upvotes: number; is_resolved: boolean; created_at: string; author_name: string;
};
type PlaceReview = {
    id: number; place_name: string; place_type: string | null;
    location: string | null; rating: number; safety_rating: number | null;
    body: string; tags: string[]; upvotes: number; created_at: string; author_name: string;
};
type GroupMessage = {
    id: number; group_id: number; author_id: number | null;
    author_name: string; body: string; created_at: string;
};

// ── API helpers ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});
const get = (path: string) => fetch(`${BASE}${path}`, { headers: headers() }).then(r => r.json());
const post = (path: string, body: any) =>
    fetch(`${BASE}${path}`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(r => r.json());
const del = (path: string) =>
    fetch(`${BASE}${path}`, { method: "DELETE", headers: headers() });
const patch = (path: string) =>
    fetch(`${BASE}${path}`, { method: "PATCH", headers: headers() }).then(r => r.json());

// ── Config ─────────────────────────────────────────────────────────────────────
const categoryConfig: Record<string, { color: string; icon: string }> = {
    safety: { color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300", icon: "🛡️" },
    destination: { color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", icon: "🗺️" },
    solo: { color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300", icon: "🎒" },
    general: { color: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300", icon: "💬" },
};

const postTypeConfig: Record<string, { label: string; color: string; Icon: any }> = {
    report: { label: "Report", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300", Icon: AlertTriangle },
    tip: { label: "Tip", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", Icon: Lightbulb },
    review: { label: "Review", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300", Icon: Star },
    general: { label: "Post", color: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300", Icon: MessageCircle },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => onChange?.(n)}
                    className={`text-xl transition-transform ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"} ${n <= value ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}>
                    ★
                </button>
            ))}
        </div>
    );
}

function SafetyDots({ value }: { value: number | null }) {
    if (!value) return null;
    return (
        <div className="flex gap-1 items-center">
            <Shield className="h-3 w-3 text-pink-500 shrink-0" />
            {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className={`h-2 w-2 rounded-full ${n <= value ? "bg-pink-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            ))}
        </div>
    );
}

// ── Group Chat Panel ───────────────────────────────────────────────────────────

function GroupChatPanel({
    group,
    currentUserId,
    onClose,
}: {
    group: Group;
    currentUserId: number | null;
    onClose: () => void;
}) {
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadMessages = async (beforeId?: number) => {
        const url = `/community/groups/${group.id}/messages?limit=40${beforeId ? `&before_id=${beforeId}` : ""}`;
        const data: GroupMessage[] = await get(url);
        if (!Array.isArray(data)) return;
        if (beforeId) {
            setMessages(prev => [...data, ...prev]);
            setHasMore(data.length === 40);
        } else {
            setMessages(data);
            setHasMore(data.length === 40);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadMessages().finally(() => setLoading(false));
        // Poll for new messages every 5 s (replace with WS if available)
        const interval = setInterval(() => loadMessages(), 5000);
        return () => clearInterval(interval);
    }, [group.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const send = async () => {
        const body = draft.trim();
        if (!body) return;
        setSending(true);
        try {
            const msg: GroupMessage = await post(`/community/groups/${group.id}/messages`, { body });
            if (msg?.id) setMessages(prev => [...prev, msg]);
            setDraft("");
        } catch { toast.error("Failed to send message"); }
        finally { setSending(false); }
    };

    const deleteMsg = async (msgId: number) => {
        await del(`/community/groups/${group.id}/messages/${msgId}`);
        setMessages(prev => prev.filter(m => m.id !== msgId));
    };

    const loadMore = async () => {
        if (!messages.length || loadingMore) return;
        setLoadingMore(true);
        await loadMessages(messages[0].id);
        setLoadingMore(false);
    };

    const cfg = categoryConfig[group.category] ?? categoryConfig.general;

    return (
        <motion.div
            initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
            className="flex flex-col h-[600px] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/20 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-xl">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{group.name}</p>
                    <p className="text-white/60 text-xs">{group.member_count} members</p>
                </div>
                <MessageCircle className="h-4 w-4 text-white/60" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {hasMore && (
                    <div className="flex justify-center">
                        <button onClick={loadMore} disabled={loadingMore}
                            className="text-xs text-slate-400 hover:text-violet-600 flex items-center gap-1 font-bold">
                            {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronDown className="h-3 w-3" />}
                            Load older messages
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-bold">No messages yet</p>
                        <p className="text-xs mt-1">Be the first to say something!</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.author_id === currentUserId;
                        return (
                            <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
                                <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-black
                                    ${isMe ? "bg-violet-100 dark:bg-violet-900/50 text-violet-600" : "bg-slate-100 dark:bg-white/10 text-slate-500"}`}>
                                    {msg.author_name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                    {!isMe && (
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {msg.author_name}
                                        </span>
                                    )}
                                    <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                        ${isMe
                                            ? "bg-violet-600 text-white rounded-tr-sm"
                                            : "bg-slate-100 dark:bg-white/8 text-slate-800 dark:text-slate-200 rounded-tl-sm"}`}>
                                        {msg.body}
                                        {/* Delete button — shown on hover for own messages or if owner */}
                                        {(isMe || group.is_owner) && (
                                            <button onClick={() => deleteMsg(msg.id)}
                                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white items-center justify-center hidden group-hover:flex transition-all shadow">
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        )}
                                    </div>
                                    <span className={`text-[10px] text-slate-400 ${isMe ? "text-right" : ""}`}>
                                        {new Date(msg.created_at).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 dark:border-white/10 px-4 py-3 flex gap-2">
                <Input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message…"
                    className="rounded-2xl flex-1 bg-slate-50 dark:bg-white/5 border-0"
                />
                <Button onClick={send} disabled={sending || !draft.trim()}
                    className="rounded-2xl bg-violet-600 hover:bg-violet-700 px-4 border-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function Community() {
    const [tab, setTab] = useState<"feed" | "groups" | "reviews">("feed");

    const [groups, setGroups] = useState<Group[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [reviews, setReviews] = useState<PlaceReview[]>([]);
    const [loading, setLoading] = useState(true);

    // Current user id (needed for chat "isMe" logic)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Filters
    const [postTypeFilter, setPostTypeFilter] = useState("all");
    const [groupFilter, setGroupFilter] = useState("all");

    // Modals
    const [showNewPost, setShowNewPost] = useState(false);
    const [showNewReview, setShowNewReview] = useState(false);
    const [showNewGroup, setShowNewGroup] = useState(false);
    const [chatGroup, setChatGroup] = useState<Group | null>(null);

    // New post form
    const [newPost, setNewPost] = useState({ title: "", body: "", post_type: "general", location: "", group_id: "" as string | number });
    const [savingPost, setSavingPost] = useState(false);

    // New review form
    const [newReview, setNewReview] = useState({ place_name: "", place_type: "area", location: "", rating: 0, safety_rating: 0, body: "", tags: [] as string[] });
    const [tagInput, setTagInput] = useState("");
    const [savingReview, setSavingReview] = useState(false);

    // New group form
    const [newGroup, setNewGroup] = useState({ name: "", description: "", category: "general" });
    const [savingGroup, setSavingGroup] = useState(false);

    // Load
    const loadAll = async () => {
        setLoading(true);
        try {
            const [g, p, r] = await Promise.all([
                get("/community/groups"),
                get("/community/posts?limit=30"),
                get("/community/reviews?limit=30"),
            ]);
            setGroups(Array.isArray(g) ? g : []);
            setPosts(Array.isArray(p) ? p : []);
            setReviews(Array.isArray(r) ? r : []);
        } catch { toast.error("Failed to load community data"); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadAll();
        // Fetch current user id from token
        get("/users/me").then(u => { if (u?.id) setCurrentUserId(u.id); }).catch(() => { });
    }, []);

    // Join / leave
    const toggleMembership = async (group: Group) => {
        try {
            if (group.is_member) {
                await del(`/community/groups/${group.id}/leave`);
                toast.success(`Left "${group.name}"`);
            } else {
                await post(`/community/groups/${group.id}/join`, {});
                toast.success(`Joined "${group.name}"`);
            }
            loadAll();
        } catch { toast.error("Something went wrong"); }
    };

    // Delete group (owner only)
    const deleteGroup = async (group: Group) => {
        if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
        try {
            await del(`/community/groups/${group.id}`);
            toast.success(`Deleted "${group.name}"`);
            if (chatGroup?.id === group.id) setChatGroup(null);
            loadAll();
        } catch { toast.error("Failed to delete group"); }
    };

    // Submit post
    const submitPost = async () => {
        if (!newPost.title || !newPost.body) { toast.error("Fill in title and body"); return; }
        setSavingPost(true);
        try {
            await post("/community/posts", {
                ...newPost,
                group_id: newPost.group_id ? Number(newPost.group_id) : null,
                location: newPost.location || null,
            });
            toast.success("Posted!");
            setShowNewPost(false);
            setNewPost({ title: "", body: "", post_type: "general", location: "", group_id: "" });
            loadAll();
        } catch { toast.error("Failed to post"); }
        finally { setSavingPost(false); }
    };

    // Submit review
    const submitReview = async () => {
        if (!newReview.place_name || !newReview.body || newReview.rating === 0) {
            toast.error("Fill in place name, a review, and at least one star"); return;
        }
        setSavingReview(true);
        try {
            await post("/community/reviews", { ...newReview, location: newReview.location || null, safety_rating: newReview.safety_rating || null });
            toast.success("Review submitted!");
            setShowNewReview(false);
            setNewReview({ place_name: "", place_type: "area", location: "", rating: 0, safety_rating: 0, body: "", tags: [] });
            loadAll();
        } catch { toast.error("Failed to submit review"); }
        finally { setSavingReview(false); }
    };

    // Submit group
    const submitGroup = async () => {
        if (!newGroup.name) { toast.error("Group name required"); return; }
        setSavingGroup(true);
        try {
            await post("/community/groups", newGroup);
            toast.success("Group created!");
            setShowNewGroup(false);
            setNewGroup({ name: "", description: "", category: "general" });
            loadAll();
        } catch { toast.error("Failed to create group"); }
        finally { setSavingGroup(false); }
    };

    const upvotePost = async (id: number) => {
        await post(`/community/posts/${id}/upvote`, {});
        setPosts(prev => prev.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
    };
    const upvoteReview = async (id: number) => {
        await post(`/community/reviews/${id}/upvote`, {});
        setReviews(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    };

    const filteredPosts = posts.filter(p => {
        const matchType = postTypeFilter === "all" || p.post_type === postTypeFilter;
        const matchGroup = groupFilter === "all" || String(p.group_id) === groupFilter;
        return matchType && matchGroup;
    });

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

            {/* ── Header ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Community</h1>
                        </div>
                        <p className="text-white/70 text-sm font-medium">
                            Safety reports, travel tips, and place reviews — all from real travellers.
                        </p>
                        <div className="flex gap-3 mt-4 text-sm">
                            <span className="bg-white/10 px-3 py-1 rounded-full font-bold">{groups.length} groups</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full font-bold">{posts.length} posts</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full font-bold">{reviews.length} reviews</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setShowNewPost(true)}
                            className="bg-white text-violet-700 hover:bg-white/90 font-black rounded-2xl px-6">
                            <Plus className="h-4 w-4 mr-2" /> New Post
                        </Button>
                        <Button onClick={() => setShowNewReview(true)}
                            className="bg-white/20 hover:bg-white/30 text-white font-black rounded-2xl px-6 border-0">
                            <Star className="h-4 w-4 mr-2" /> Review a Place
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
                {(["feed", "groups", "reviews"] as const).map(t => (
                    <button key={t} onClick={() => { setTab(t); setChatGroup(null); }}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all
                            ${tab === t ? "bg-white dark:bg-zinc-800 shadow text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700"}`}>
                        {t === "feed" ? "📣 Feed" : t === "groups" ? "👥 Groups" : "⭐ Reviews"}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
            ) : (
                <>
                    {/* ── Feed ── */}
                    {tab === "feed" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex flex-wrap gap-3 items-center">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <div className="flex gap-2 flex-wrap">
                                    {["all", "report", "tip", "review", "general"].map(f => (
                                        <button key={f} onClick={() => setPostTypeFilter(f)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all
                                                ${postTypeFilter === f ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200"}`}>
                                            {f === "all" ? "All" : postTypeConfig[f]?.label ?? f}
                                        </button>
                                    ))}
                                </div>
                                {/* <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                                    className="ml-auto text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 outline-none">
                                    <option value="all">All groups</option>
                                    {groups.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                                    <option value="null">No group</option>
                                </select> */}
                            </div>

                            {filteredPosts.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No posts yet</p>
                                    <button onClick={() => setShowNewPost(true)} className="mt-3 text-violet-600 font-bold text-sm underline">
                                        Be the first to post
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredPosts.map((post, i) => {
                                        const cfg = postTypeConfig[post.post_type] ?? postTypeConfig.general;
                                        const { Icon } = cfg;
                                        return (
                                            <motion.div key={post.id}
                                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}>
                                                <Card className={`hover:shadow-lg transition-all duration-200 rounded-3xl overflow-hidden ${post.is_resolved ? "opacity-60" : ""}`}>
                                                    <div className={`h-1 ${post.post_type === "report" ? "bg-red-500" : post.post_type === "tip" ? "bg-amber-400" : post.post_type === "review" ? "bg-green-500" : "bg-violet-400"}`} />
                                                    <CardContent className="pt-5 pb-5 px-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                                                                        <Icon className="h-3 w-3" />{cfg.label}
                                                                    </span>
                                                                    {post.is_resolved && (
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                                                            <CheckCircle2 className="h-3 w-3" /> Resolved
                                                                        </span>
                                                                    )}
                                                                    {post.location && (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                                            <MapPin className="h-3 w-3" />{post.location}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h3 className="font-black text-base tracking-tight mb-1">{post.title}</h3>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{post.body}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                                                            <div className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                                                                <span>{post.author_name}</span>
                                                                <span>·</span>
                                                                <span>{new Date(post.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                                                            </div>
                                                            <button onClick={() => upvotePost(post.id)}
                                                                className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-violet-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/30">
                                                                <ThumbsUp className="h-3.5 w-3.5" />{post.upvotes}
                                                            </button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Groups ── */}
                    {tab === "groups" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {!chatGroup ? (
                                <>
                                    <div className="flex justify-end">
                                        <Button onClick={() => setShowNewGroup(true)}
                                            className="rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black">
                                            <Plus className="h-4 w-4 mr-2" /> Create Group
                                        </Button>
                                    </div>
                                    {groups.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No groups yet</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {groups.map((group, i) => {
                                                const cfg = categoryConfig[group.category] ?? categoryConfig.general;
                                                return (
                                                    <motion.div key={group.id}
                                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }}>
                                                        <Card className="h-full rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                                                            <div className={`h-1.5 ${group.category === "safety" ? "bg-red-500" : group.category === "destination" ? "bg-blue-500" : group.category === "solo" ? "bg-violet-500" : "bg-slate-400"}`} />
                                                            <CardContent className="pt-5 pb-5 flex flex-col flex-1">
                                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-2xl">{cfg.icon}</span>
                                                                        <div>
                                                                            <h3 className="font-black text-base tracking-tight leading-tight">{group.name}</h3>
                                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                                                {group.category}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {group.is_owner && (
                                                                            <button onClick={() => deleteGroup(group)}
                                                                                title="Delete group"
                                                                                className="p-1.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                        {group.is_public
                                                                            ? <Globe className="h-4 w-4 text-slate-300 shrink-0" />
                                                                            : <Lock className="h-4 w-4 text-slate-300 shrink-0" />}
                                                                    </div>
                                                                </div>
                                                                {group.description && (
                                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed flex-1">
                                                                        {group.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5 gap-2">
                                                                    <span className="text-xs font-bold text-slate-400">
                                                                        <Users className="h-3.5 w-3.5 inline mr-1" />
                                                                        {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        {group.is_member && (
                                                                            <Button size="sm" onClick={() => setChatGroup(group)}
                                                                                variant="outline"
                                                                                className="rounded-xl font-black text-xs h-8 border-violet-200 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20">
                                                                                <MessageCircle className="h-3 w-3 mr-1" /> Chat
                                                                            </Button>
                                                                        )}
                                                                        {!group.is_owner && (
                                                                            <Button size="sm" onClick={() => toggleMembership(group)}
                                                                                variant={group.is_member ? "outline" : "default"}
                                                                                className={`rounded-xl font-black text-xs h-8 ${!group.is_member ? "bg-violet-600 hover:bg-violet-700 text-white border-0" : ""}`}>
                                                                                {group.is_member ? "Leave" : "Join"}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <GroupChatPanel
                                        key={chatGroup.id}
                                        group={chatGroup}
                                        currentUserId={currentUserId}
                                        onClose={() => setChatGroup(null)}
                                    />
                                </AnimatePresence>
                            )}
                        </motion.div>
                    )}

                    {/* ── Reviews ── */}
                    {tab === "reviews" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <div className="flex justify-end">
                                <Button onClick={() => setShowNewReview(true)}
                                    className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black">
                                    <Star className="h-4 w-4 mr-2" /> Add Review
                                </Button>
                            </div>
                            {reviews.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No reviews yet</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review, i) => (
                                        <motion.div key={review.id}
                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
                                            <Card className="rounded-3xl hover:shadow-xl transition-all duration-300 overflow-hidden">
                                                <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                                                <CardContent className="pt-5 pb-5 px-6">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div>
                                                            <h3 className="font-black text-base tracking-tight">{review.place_name}</h3>
                                                            {review.location && (
                                                                <p className="text-xs text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />{review.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {review.place_type && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
                                                                {review.place_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <StarRating value={review.rating} />
                                                        <SafetyDots value={review.safety_rating} />
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">{review.body}</p>
                                                    {review.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {review.tags.map(tag => (
                                                                <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-white/5 text-slate-500">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                                        <span className="text-xs font-bold text-slate-400">{review.author_name} · {new Date(review.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                                                        <button onClick={() => upvoteReview(review.id)}
                                                            className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-amber-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20">
                                                            <ThumbsUp className="h-3.5 w-3.5" />{review.upvotes}
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </>
            )}

            {/* ── Modal: New Post ── */}
            <AnimatePresence>
                {showNewPost && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
                                <h2 className="font-black text-lg uppercase tracking-tighter">New Post</h2>
                                <button onClick={() => setShowNewPost(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(postTypeConfig).map(([key, cfg]) => (
                                        <button key={key} onClick={() => setNewPost(p => ({ ...p, post_type: key }))}
                                            className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all
                                                ${newPost.post_type === key ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"}`}>
                                            <cfg.Icon className="h-4 w-4" /> {cfg.label}
                                        </button>
                                    ))}
                                </div>
                                <Input placeholder="Title *" value={newPost.title}
                                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} className="rounded-xl" />
                                <Textarea placeholder="What do you want to share? *" rows={4} value={newPost.body}
                                    onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))} className="rounded-xl resize-none" />
                                <Input placeholder="Location (optional)" value={newPost.location}
                                    onChange={e => setNewPost(p => ({ ...p, location: e.target.value }))} className="rounded-xl" />
                                <select value={String(newPost.group_id)}
                                    onChange={e => setNewPost(p => ({ ...p, group_id: e.target.value }))}
                                    className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-4 py-3 outline-none">
                                    <option value="">No group (global feed)</option>
                                    {groups.filter(g => g.is_member).map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                                </select>
                                <Button onClick={submitPost} disabled={savingPost} className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 font-black py-6">
                                    {savingPost ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    Publish Post
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Modal: New Review ── */}
            <AnimatePresence>
                {showNewReview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                <h2 className="font-black text-lg uppercase tracking-tighter">Review a Place</h2>
                                <button onClick={() => setShowNewReview(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <Input placeholder="Place name *" value={newReview.place_name}
                                    onChange={e => setNewReview(r => ({ ...r, place_name: e.target.value }))} className="rounded-xl" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Type</label>
                                        <select value={newReview.place_type}
                                            onChange={e => setNewReview(r => ({ ...r, place_type: e.target.value }))}
                                            className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-4 py-3 outline-none">
                                            {["area", "restaurant", "hotel", "transport", "attraction"].map(t =>
                                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-1">Location</label>
                                        <Input placeholder="City, Country" value={newReview.location}
                                            onChange={e => setNewReview(r => ({ ...r, location: e.target.value }))} className="rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Overall Rating *</label>
                                    <StarRating value={newReview.rating} onChange={v => setNewReview(r => ({ ...r, rating: v }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Women's Safety Rating</label>
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 text-pink-500 shrink-0" />
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} type="button" onClick={() => setNewReview(r => ({ ...r, safety_rating: n }))}
                                                    className={`h-6 w-6 rounded-full border-2 transition-all ${n <= newReview.safety_rating ? "bg-pink-500 border-pink-500" : "border-slate-300 dark:border-slate-600 hover:border-pink-400"}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Textarea placeholder="Your experience… *" rows={4} value={newReview.body}
                                    onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))} className="rounded-xl resize-none" />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">Tags</label>
                                    <div className="flex gap-2">
                                        <Input placeholder="e.g. well-lit, women-only" value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { setNewReview(r => ({ ...r, tags: [...r.tags, tagInput.trim().toLowerCase()] })); setTagInput(""); } }}
                                            className="rounded-xl flex-1" />
                                        <Button variant="outline" className="rounded-xl"
                                            onClick={() => { if (tagInput.trim()) { setNewReview(r => ({ ...r, tags: [...r.tags, tagInput.trim().toLowerCase()] })); setTagInput(""); } }}>
                                            Add
                                        </Button>
                                    </div>
                                    {newReview.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {newReview.tags.map(tag => (
                                                <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-bold">
                                                    #{tag}
                                                    <button onClick={() => setNewReview(r => ({ ...r, tags: r.tags.filter(t => t !== tag) }))} className="text-slate-400 hover:text-red-500 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Button onClick={submitReview} disabled={savingReview}
                                    className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 font-black py-6 text-white border-0">
                                    {savingReview ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                                    Submit Review
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Modal: New Group ── */}
            <AnimatePresence>
                {showNewGroup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/10">
                                <h2 className="font-black text-lg uppercase tracking-tighter">Create Group</h2>
                                <button onClick={() => setShowNewGroup(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <Input placeholder="Group name *" value={newGroup.name}
                                    onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))} className="rounded-xl" />
                                <Textarea placeholder="Description (optional)" rows={3} value={newGroup.description}
                                    onChange={e => setNewGroup(g => ({ ...g, description: e.target.value }))} className="rounded-xl resize-none" />
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block mb-2">Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(categoryConfig).map(([key, cfg]) => (
                                            <button key={key} onClick={() => setNewGroup(g => ({ ...g, category: key }))}
                                                className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all
                                                    ${newGroup.category === key ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300" : "border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300"}`}>
                                                <span className="text-base">{cfg.icon}</span> {key}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button onClick={submitGroup} disabled={savingGroup}
                                    className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 font-black py-6 border-0">
                                    {savingGroup ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                                    Create Group
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
