import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "../src/components/ui/button";
import { toast } from "sonner";

interface SavePlaceButtonProps {
    place: PlacePayload;
    size?: "sm" | "default";
    className?: string;
}

export function SavePlaceButton({ place, size = "sm", className = "" }: SavePlaceButtonProps) {
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (saved) { toast("Already saved!"); return; }
        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/saved-places/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(place),
            });
            if (!res.ok) throw new Error("Could not save place");
            setSaved(true);
            toast.success(`"${place.name}" saved!`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={saved ? "default" : "outline"}
            size={size}
            onClick={handleSave}
            disabled={loading}
            className={`font-bold transition-all ${saved ? "bg-pink-600 hover:bg-pink-700 text-white border-pink-600" : ""} ${className}`
            }
        >
            {
                loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                )}
            <span className="ml-1.5" > {saved ? "Saved" : "Save"} </span>
        </Button>
    );
}
