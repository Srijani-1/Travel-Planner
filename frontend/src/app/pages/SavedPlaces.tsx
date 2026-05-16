import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
    Bookmark,
    MapPin,
    Plus,
    Trash2,
    UtensilsCrossed,
    Hotel,
    Landmark,
    Search,
    Loader2,
    Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavedPlace {
    id: number;
    name: string;
    lat: number;
    lon: number;
    category?: string;
    notes?: string;
    image_url?: string;
    created_at: string;
}

interface PlaceFormState {
    name: string;
    lat: string;
    lon: string;
    category: string;
    notes: string;
    image_url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORY_META: Record<
    string,
    { icon: React.ElementType; color: string; label: string }
> = {
    restaurant: {
        icon: UtensilsCrossed,
        color: "from-orange-500 to-red-500",
        label: "Restaurant",
    },
    hotel: {
        icon: Hotel,
        color: "from-blue-500 to-indigo-600",
        label: "Hotel",
    },
    attraction: {
        icon: Landmark,
        color: "from-violet-500 to-purple-600",
        label: "Attraction",
    },
    other: {
        icon: MapPin,
        color: "from-slate-500 to-slate-700",
        label: "Other",
    },
};

function getCategoryMeta(category?: string) {
    return CATEGORY_META[category ?? "other"] ?? CATEGORY_META.other;
}

// ─── Place Card ───────────────────────────────────────────────────────────────
function PlaceCard({
    place,
    onDelete,
}: {
    place: SavedPlace;
    onDelete: (id: number) => void;
}) {
    const meta = getCategoryMeta(place.category);
    const Icon = meta.icon;

    // Try to get a nice map thumbnail from open-meteo-friendly source
    const mapThumb =
        place.image_url ||
        `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e91e8c(${place.lon},${place.lat})/${place.lon},${place.lat},13,0/400x200@2x?access_token=pk.placeholder`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="group"
        >
            <Card className="overflow-hidden border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 rounded-2xl">
                {/* Top accent */}
                <div className={`h-1 w-full bg-gradient-to-r ${meta.color}`} />

                <CardContent className="p-5 flex items-start gap-4">
                    {/* Icon badge */}
                    <div
                        className={`shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md`}
                    >
                        <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-black text-lg text-slate-900 dark:text-white tracking-tight truncate">
                                    {place.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <Badge
                                        variant="secondary"
                                        className="text-[10px] font-bold uppercase tracking-widest px-2"
                                    >
                                        {meta.label}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                                    </span>
                                </div>
                            </div>

                            {/* Delete */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-slate-200 dark:border-white/10">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="font-black text-2xl uppercase tracking-tight">
                                            Remove place?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <strong>{place.name}</strong> will be removed from your
                                            saved places.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-bold">
                                            Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(place.id)}
                                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                                        >
                                            Remove
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {place.notes && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                                {place.notes}
                            </p>
                        )}

                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                            Saved{" "}
                            {new Date(place.created_at).toLocaleDateString("en", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// ─── Add Place Dialog ─────────────────────────────────────────────────────────
function AddPlaceDialog({ onAdded }: { onAdded: (place: SavedPlace) => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [form, setForm] = useState<PlaceFormState>({
        name: "",
        lat: "",
        lon: "",
        category: "attraction",
        notes: "",
        image_url: "",
    });

    const set = (key: keyof PlaceFormState) => (val: string) =>
        setForm((f) => ({ ...f, [key]: val }));

    // Geocode the place name to auto-fill lat/lon
    const geocode = async () => {
        if (!form.name.trim()) return;
        setGeoLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.name)}&format=json&limit=1`,
                { headers: { "Accept-Language": "en" } }
            );
            const data = await res.json();
            if (data[0]) {
                setForm((f) => ({
                    ...f,
                    lat: parseFloat(data[0].lat).toFixed(6),
                    lon: parseFloat(data[0].lon).toFixed(6),
                }));
                toast.success("Coordinates filled automatically");
            } else {
                toast.error("Location not found – please enter coordinates manually");
            }
        } catch {
            toast.error("Geocoding failed");
        } finally {
            setGeoLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.lat || !form.lon) {
            toast.error("Name, latitude, and longitude are required");
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API}/saved-places/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    lat: parseFloat(form.lat),
                    lon: parseFloat(form.lon),
                    category: form.category || null,
                    notes: form.notes.trim() || null,
                    image_url: form.image_url.trim() || null,
                }),
            });
            if (!res.ok) throw new Error("Failed to save place");
            const saved: SavedPlace = await res.json();
            onAdded(saved);
            setOpen(false);
            setForm({
                name: "",
                lat: "",
                lon: "",
                category: "attraction",
                notes: "",
                image_url: "",
            });
            toast.success("Place saved!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black rounded-2xl px-6 py-5 shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                    <Plus className="h-5 w-5 mr-2" />
                    Save Place
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-slate-200 dark:border-white/10 shadow-2xl max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-black text-2xl uppercase tracking-tight">
                        Save a Place
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Name + geocode */}
                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">
                            Place Name *
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. Taj Mahal, Agra"
                                value={form.name}
                                onChange={(e) => set("name")(e.target.value)}
                                className="rounded-xl flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={geocode}
                                disabled={geoLoading || !form.name.trim()}
                                className="rounded-xl shrink-0 font-bold text-xs px-3"
                            >
                                {geoLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Auto-fill"
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Click "Auto-fill" to geocode coordinates automatically
                        </p>
                    </div>

                    {/* Lat / Lon */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">
                                Latitude *
                            </Label>
                            <Input
                                placeholder="e.g. 27.1751"
                                value={form.lat}
                                onChange={(e) => set("lat")(e.target.value)}
                                className="rounded-xl font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">
                                Longitude *
                            </Label>
                            <Input
                                placeholder="e.g. 78.0421"
                                value={form.lon}
                                onChange={(e) => set("lon")(e.target.value)}
                                className="rounded-xl font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">
                            Category
                        </Label>
                        <Select value={form.category} onValueChange={set("category")}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                                <SelectItem value="hotel">🏨 Hotel / Stay</SelectItem>
                                <SelectItem value="attraction">🏛️ Attraction</SelectItem>
                                <SelectItem value="other">📍 Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">
                            Notes (optional)
                        </Label>
                        <Input
                            placeholder="e.g. Great sunrise view, book tickets online"
                            value={form.notes}
                            onChange={(e) => set("notes")(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black rounded-2xl py-5 uppercase tracking-widest"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Bookmark className="h-4 w-4 mr-2" />
                        )}
                        {saving ? "Saving…" : "Save Place"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SavedPlaces() {
    const navigate = useNavigate();
    const [places, setPlaces] = useState<SavedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");

    const fetchPlaces = useCallback(async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API}/saved-places/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                localStorage.removeItem("access_token");
                toast.error("Session expired. Please log in again.");
                navigate("/");
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch saved places");
            setPlaces(await res.json());
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API}/saved-places/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to remove place");
            setPlaces((prev) => prev.filter((p) => p.id !== id));
            toast.success("Place removed");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filtered = places.filter((p) => {
        const matchSearch =
            !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.notes?.toLowerCase().includes(search.toLowerCase());
        const matchCat =
            filterCategory === "all" || p.category === filterCategory;
        return matchSearch && matchCat;
    });

    // Counts per category for filter badges
    const counts = places.reduce(
        (acc, p) => {
            const cat = p.category ?? "other";
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
                <p className="font-medium text-slate-500">Loading saved places…</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        Saved Places
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {places.length} place{places.length !== 1 ? "s" : ""} bookmarked
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <AddPlaceDialog onAdded={(p) => setPlaces((prev) => [p, ...prev])} />
                </motion.div>
            </div>

            {/* ── Filters ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-3 mb-8"
            >
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search places or notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur border-slate-200 dark:border-white/10"
                    />
                </div>

                {/* Category filter chips */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: "all", label: "All", count: places.length },
                        { key: "restaurant", label: "🍽️ Food", count: counts.restaurant || 0 },
                        { key: "hotel", label: "🏨 Stays", count: counts.hotel || 0 },
                        {
                            key: "attraction",
                            label: "🏛️ Spots",
                            count: counts.attraction || 0,
                        },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilterCategory(f.key)}
                            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${filterCategory === f.key
                                    ? "bg-pink-600 text-white border-pink-600 shadow-lg shadow-pink-500/20"
                                    : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-pink-300"
                                }`}
                        >
                            {f.label}
                            <span
                                className={`ml-1.5 ${filterCategory === f.key ? "opacity-80" : "opacity-50"}`}
                            >
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ── Grid ── */}
            {filtered.length > 0 ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <AnimatePresence>
                        {filtered.map((place) => (
                            <PlaceCard key={place.id} place={place} onDelete={handleDelete} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50 dark:bg-white/5"
                >
                    <Bookmark className="h-14 w-14 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                        {search || filterCategory !== "all"
                            ? "No places match your filter"
                            : "No saved places yet"}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        {search || filterCategory !== "all"
                            ? "Try a different search or category"
                            : "Bookmark places from your itineraries or add them manually"}
                    </p>
                    {!search && filterCategory === "all" && (
                        <AddPlaceDialog
                            onAdded={(p) => setPlaces((prev) => [p, ...prev])}
                        />
                    )}
                </motion.div>
            )}
        </div>
    );
}
