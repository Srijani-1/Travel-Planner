// hooks/useSavedPlaces.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface PlacePayload {
    name: string;
    lat: number;
    lon: number;
    category?: string;
    notes?: string;
    image_url?: string;
}

export function useSavePlace() {
    const [saving, setSaving] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const savePlace = useCallback(async (place: PlacePayload) => {
        const key = place.name;
        if (savedIds.has(key)) {
            toast("Already saved!");
            return;
        }
        setSaving((s) => new Set(s).add(key));
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API}/saved-places/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(place),
            });
            if (!res.ok) throw new Error("Could not save place");
            setSavedIds((ids) => new Set(ids).add(key));
            toast.success(`"${place.name}" saved to your places!`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving((s) => {
                const next = new Set(s);
                next.delete(key);
                return next;
            });
        }
    }, [savedIds]);

    return {
        savePlace,
        isSaving: (name: string) => saving.has(name),
        savedIds,
    };
}
