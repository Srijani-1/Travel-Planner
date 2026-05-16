// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from "react";
import { api } from '../api/index';

export function useDashboardStats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.stats.dashboard({ _t: Date.now() });
            setStats(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Load on mount
        load();

        // Refresh when window regains focus to ensure stats are fresh
        const handleFocus = () => load();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [load]);
    return { stats, loading, error, refetch: load };
}

export function useRecommendations() {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.recommendations.get()
            .then(setRecs)
            .catch(() => setRecs([]))
            .finally(() => setLoading(false));
    }, []);

    return { recs, loading };
}

export function useSavedPlaces() {
    const [places, setPlaces] = useState<any[]>([]);

    const load = () => api.savedPlaces.list().then(setPlaces).catch(() => { });

    useEffect(() => { load(); }, []);

    const save = async (data: any) => {
        await api.savedPlaces.save(data);
        load();
    };

    const remove = async (id: number) => {
        await api.savedPlaces.delete(id);
        load();
    };

    return { places, save, remove, count: places.length };
}
