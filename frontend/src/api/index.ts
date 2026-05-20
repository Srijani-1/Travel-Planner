// src/api/index.ts

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getHeaders(): Record<string, string> {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { ...getHeaders(), ...(options.headers || {}) },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Request failed");
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

// ── Trips ──────────────────────────────────────────────────────────────────
export const api = {
    trips: {
        plan: (data: any) => request("/trips/plan", { method: "POST", body: JSON.stringify(data) }),
        list: () => request<any[]>("/trips/"),
        get: (id: number) => request<any>(`/trips/${id}`),
        delete: (id: number) => request(`/trips/${id}`, { method: "DELETE" }),
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    stats: {
        dashboard: (params?: any) => {
            const q = params ? `?${new URLSearchParams(params).toString()}` : "";
            return request<{
                trips_planned: number;
                trips_completed: number;
                saved_places: number;
                countries_visited: number;
                upcoming_trips: any[];
            }>(`/stats/dashboard${q}`);
        },
    },

    // ── Saved Places ───────────────────────────────────────────────────────
    savedPlaces: {
        list: () => request<any[]>("/saved-places/"),
        save: (data: { name: string; lat: number; lon: number; category?: string; notes?: string; image_url?: string }) =>
            request("/saved-places/", { method: "POST", body: JSON.stringify(data) }),
        delete: (id: number) => request(`/saved-places/${id}`, { method: "DELETE" }),
    },

    // ── Safe Stays ─────────────────────────────────────────────────────────
    stays: {
        list: (params?: { stay_type?: string; location?: string; check_in?: string; check_out?: string }) => {
            const q = new URLSearchParams(params as any).toString();
            return request<any[]>(`/stays/${q ? `?${q}` : ""}`);
        },
    },

    // ── Safe Rides ─────────────────────────────────────────────────────────
    rides: {
        drivers: (city?: string) => {
            const q = city ? `?city=${encodeURIComponent(city)}` : "";
            return request<any[]>(`/rides/drivers${q}`);
        },
        book: (data: { driver_id: number; pickup: string; dropoff: string }) =>
            request("/rides/book", { method: "POST", body: JSON.stringify(data) }),
        myBookings: () => request<any[]>("/rides/my-bookings"),
    },

    // ── SOS ────────────────────────────────────────────────────────────────
    sos: {
        trigger: (data: { lat: number; lon: number; message?: string; trip_id?: string }) =>
            request("/sos/trigger", { method: "POST", body: JSON.stringify(data) }),

        contacts: {
            list: () => request<any[]>("/sos/contacts"),
            sendOtp: (data: { name: string; phone: string; relation?: string }) =>
                request("/sos/contacts/send-otp", { method: "POST", body: JSON.stringify(data) }),
            verifyOtp: (data: { phone: string; otp: string }) =>
                request("/sos/contacts/verify-otp", { method: "POST", body: JSON.stringify(data) }),
            delete: (id: number) => request(`/sos/contacts/${id}`, { method: "DELETE" }),
        },
    },
    // ── Check-In ───────────────────────────────────────────────────────────
    checkin: {
        post: (data: { trip_id: string; lat?: number; lon?: number }) =>
            request("/sos/checkin", { method: "POST", body: JSON.stringify(data) }),

        register: (trip_id: string, interval_minutes: number) =>
            request(
                `/sos/checkin/register?trip_id=${encodeURIComponent(trip_id)}&interval_minutes=${interval_minutes}`,
                { method: "POST" }
            ),

        unregister: () => request("/sos/checkin/register", { method: "DELETE" }),
    },

    // ── Live Location (REST polling fallback) ──────────────────────────────
    location: {
        update: (data: { trip_id: string; lat: number; lon: number }) =>
            request("/sos/location/update", { method: "POST", body: JSON.stringify(data) }),
    },

    // ── Nearby Alerts ──────────────────────────────────────────────────────
    alerts: {
        nearby: (params: { lat: number; lon: number; radius_km?: number }) => {
            const q = new URLSearchParams({
                lat: String(params.lat),
                lon: String(params.lon),
                radius_km: String(params.radius_km ?? 5),
            }).toString();
            return request<any[]>(`/sos/alerts/nearby?${q}`);
        },
    },

    // ── Incident Reports ───────────────────────────────────────────────────
    incidents: {
        report: (data: { trip_id: string; description: string; lat?: number; lon?: number }) =>
            request("/sos/incidents/report", { method: "POST", body: JSON.stringify(data) }),
    },

    // ── Recommendations ────────────────────────────────────────────────────
    recommendations: {
        get: () => request<any[]>("/recommendations/"),
    },

    // ── Profile ────────────────────────────────────────────────────────────
    profile: {
        get: () => request<any>("/users/profile"),
        update: (data: any) => request("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
        delete: () => request("/users/profile", { method: "DELETE" }),
    },
};
