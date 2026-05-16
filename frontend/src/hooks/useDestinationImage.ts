import { useState, useEffect } from "react";

const cache = new Map<string, string>();

export function useDestinationImage(query: string | undefined, fallback?: string) {
    const [src, setSrc] = useState<string>(fallback ?? "");
    const [loading, setLoading] = useState(!!query);

    useEffect(() => {
        if (!query) return;

        // Check in-memory cache first
        if (cache.has(query)) {
            setSrc(cache.get(query)!);
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("access_token");
        setLoading(true);

        fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/images/search?q=${encodeURIComponent(query)}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then((r) => r.json())
            .then((data) => {
                if (data.url) {
                    cache.set(query, data.url);
                    setSrc(data.url);
                }
            })
            .catch(() => { }) // keep fallback on error
            .finally(() => setLoading(false));
    }, [query]);

    return { src, loading };
}
