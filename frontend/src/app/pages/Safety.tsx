import { api } from '../../api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
    Shield, Phone, MapPin, AlertTriangle, CheckCircle2,
    Users, Bell, Heart, Share2, Navigation, Clock,
    Car, BedDouble, Sparkles, ChevronRight, Info, Search,
    Wifi, WifiOff, Loader2, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trip {
    id: string;
    title: string;
    destination: string;      // mapped from destination_name
    country: string;          // derived from destination_name
    countryCode: string;      // derived from destination_name
    flag: string;             // derived from countryCode
    start_date: string;
    end_date: string;
    lat: number;              // mapped from destination_lat
    lon: number;              // mapped from destination_lon
    safety_score?: number;    // from backend
}

// Maps country name → ISO2 code (extend as needed)
const COUNTRY_CODE_MAP: Record<string, string> = {
    "france": "FR", "japan": "JP", "indonesia": "ID", "india": "IN",
    "bali": "ID", "united states": "US", "usa": "US", "uk": "GB",
    "united kingdom": "GB", "australia": "AU", "thailand": "TH",
    "spain": "ES", "italy": "IT", "germany": "DE", "singapore": "SG",
    "uae": "AE", "united arab emirates": "AE",
};
const FLAG_MAP: Record<string, string> = {
    FR: "🇫🇷", JP: "🇯🇵", ID: "🇮🇩", IN: "🇮🇳", US: "🇺🇸",
    GB: "🇬🇧", AU: "🇦🇺", TH: "🇹🇭", ES: "🇪🇸", IT: "🇮🇹",
    DE: "🇩🇪", SG: "🇸🇬", AE: "🇦🇪",
};

function mapBackendTrip(raw: any): Trip {
    const dest: string = raw.destination_name ?? raw.destination ?? "Unknown";
    // Try to derive country from the last word(s) of destination_name
    const parts = dest.split(",").map((s: string) => s.trim());
    const countryGuess = (parts[parts.length - 1] ?? "").toLowerCase();
    const countryCode = COUNTRY_CODE_MAP[countryGuess] ?? "DEFAULT";
    return {
        id: String(raw.id),
        title: raw.title ?? dest,
        destination: dest,
        country: parts[parts.length - 1] ?? dest,
        countryCode,
        flag: FLAG_MAP[countryCode] ?? "🌍",
        start_date: raw.start_date ? String(raw.start_date).slice(0, 10) : "",
        end_date: raw.end_date ? String(raw.end_date).slice(0, 10) : "",
        lat: raw.destination_lat ?? raw.lat ?? 0,
        lon: raw.destination_lon ?? raw.lon ?? 0,
        safety_score: raw.safety_score ?? undefined,
    };
}

interface EmergencyNumbers {
    country: string;
    flag: string;
    police: string;
    ambulance: string;
    fire: string;
    coastGuard?: string;
    tourismPolice?: string;
}

interface SafeZone {
    name: string;
    city: string;
    rating: number;
    description: string;
    lat: number;
    lon: number;
    type: "district" | "landmark" | "transport" | "hospital";
}

// ─── Static data keyed by country code ───────────────────────────────────────

const EMERGENCY_DB: Record<string, EmergencyNumbers> = {
    FR: { country: "France", flag: "🇫🇷", police: "17", ambulance: "15", fire: "18", tourismPolice: "3117" },
    JP: { country: "Japan", flag: "🇯🇵", police: "110", ambulance: "119", fire: "119" },
    ID: { country: "Indonesia", flag: "🇮🇩", police: "110", ambulance: "118", fire: "113", tourismPolice: "1500-304" },
    US: { country: "United States", flag: "🇺🇸", police: "911", ambulance: "911", fire: "911" },
    GB: { country: "United Kingdom", flag: "🇬🇧", police: "999", ambulance: "999", fire: "999", coastGuard: "999" },
    IN: { country: "India", flag: "🇮🇳", police: "100", ambulance: "108", fire: "101", tourismPolice: "1363" },
    AU: { country: "Australia", flag: "🇦🇺", police: "000", ambulance: "000", fire: "000", coastGuard: "000" },
    TH: { country: "Thailand", flag: "🇹🇭", police: "191", ambulance: "1669", fire: "199", tourismPolice: "1155" },
    ES: { country: "Spain", flag: "🇪🇸", police: "112", ambulance: "112", fire: "080", tourismPolice: "902 102 112" },
    IT: { country: "Italy", flag: "🇮🇹", police: "112", ambulance: "118", fire: "115" },
    DE: { country: "Germany", flag: "🇩🇪", police: "110", ambulance: "112", fire: "112" },
    SG: { country: "Singapore", flag: "🇸🇬", police: "999", ambulance: "995", fire: "995" },
    AE: { country: "UAE", flag: "🇦🇪", police: "999", ambulance: "998", fire: "997", tourismPolice: "800 4673" },
};

const SAFE_ZONES_DB: Record<string, SafeZone[]> = {
    FR: [
        { name: "Le Marais District", city: "Paris", rating: 95, description: "Well-patrolled, well-lit, cafes open late. Dense tourist activity keeps it safe.", lat: 48.8566, lon: 2.3522, type: "district" },
        { name: "Champs-Élysées Area", city: "Paris", rating: 93, description: "Heavy police presence, well-lit boulevard with 24/7 activity.", lat: 48.8698, lon: 2.3078, type: "landmark" },
        { name: "Gare du Nord Station", city: "Paris", rating: 87, description: "Major transport hub with security. Exercise caution late at night.", lat: 48.8809, lon: 2.3553, type: "transport" },
    ],
    JP: [
        { name: "Shibuya Center", city: "Tokyo", rating: 98, description: "24/7 activity, excellent public safety infrastructure, minimal crime.", lat: 35.6580, lon: 139.7016, type: "district" },
        { name: "Shinjuku East Exit", city: "Tokyo", rating: 96, description: "Major hub with constant foot traffic and koban police boxes nearby.", lat: 35.6896, lon: 139.7006, type: "transport" },
        { name: "Asakusa Temple District", city: "Tokyo", rating: 97, description: "Historic area with heavy tourist presence and regular police patrols.", lat: 35.7148, lon: 139.7967, type: "landmark" },
    ],
    ID: [
        { name: "Seminyak Beach Area", city: "Bali", rating: 88, description: "Tourist-friendly strip with regular security patrols and well-lit streets.", lat: -8.6895, lon: 115.1636, type: "district" },
        { name: "Ubud Centre", city: "Bali", rating: 91, description: "Busy day/evening with expat community, good restaurant strip.", lat: -8.5069, lon: 115.2625, type: "district" },
        { name: "Ngurah Rai Airport Area", city: "Denpasar", rating: 85, description: "Secure zone, official taxis only, well monitored.", lat: -8.7467, lon: 115.1672, type: "transport" },
    ],
    IN: [
        { name: "Connaught Place", city: "Delhi", rating: 86, description: "Central business area with metro access and frequent police presence.", lat: 28.6315, lon: 77.2167, type: "district" },
        { name: "Colaba Causeway", city: "Mumbai", rating: 89, description: "Tourist-heavy area, well-patrolled, good connectivity.", lat: 18.9220, lon: 72.8347, type: "district" },
    ],
    TH: [
        { name: "Sukhumvit Road BTS Zone", city: "Bangkok", rating: 90, description: "International zone, well-policed, tourist police kiosks throughout.", lat: 13.7307, lon: 100.5700, type: "district" },
        { name: "Nimman Road Area", city: "Chiang Mai", rating: 92, description: "Expat-friendly, well-lit, busy until midnight.", lat: 18.7953, lon: 98.9675, type: "district" },
    ],
    US: [
        { name: "Times Square", city: "New York", rating: 89, description: "Heavy NYPD presence, tourist-dense, well-lit 24/7.", lat: 40.7580, lon: -73.9855, type: "landmark" },
        { name: "The Magnificent Mile", city: "Chicago", rating: 88, description: "Premium shopping district with constant security.", lat: 41.8981, lon: -87.6251, type: "district" },
    ],
    GB: [
        { name: "South Bank", city: "London", rating: 93, description: "Well-patrolled riverside walk, lots of activity, CCTV coverage.", lat: 51.5055, lon: -0.1131, type: "district" },
        { name: "Covent Garden", city: "London", rating: 94, description: "Tourist hotspot, police-heavy area, well-lit until late.", lat: 51.5129, lon: -0.1243, type: "landmark" },
    ],
    DEFAULT: [
        { name: "City Centre", city: "Your Destination", rating: 82, description: "Stay in the main tourist zone for better safety visibility.", lat: 0, lon: 0, type: "district" },
        { name: "Main Transit Hub", city: "Your Destination", rating: 80, description: "Airports and major train stations are generally well-secured.", lat: 0, lon: 0, type: "transport" },
    ],
};

const WOMEN_FEATURES = [
    { icon: Car, label: "Women-only Rides", desc: "Verified female drivers only", route: "/dashboard/safe-ride" },
    { icon: BedDouble, label: "Safe Stays", desc: "Women-verified accommodations", route: "/dashboard/safe-stays" },
    { icon: MapPin, label: "Safe Zone Map", desc: "Well-lit, patrolled areas highlighted", route: "#" },
    { icon: Users, label: "Community Support", desc: "Traveller network & peer alerts", route: "#" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Safety() {
    // ── Trip state ──
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<string>("");
    const selectedTrip = trips.find(t => t.id === selectedTripId) ?? null;
    const countryCode = selectedTrip?.countryCode ?? "DEFAULT";

    // ── Safety toggles ──
    const [womenSafetyMode, setWomenSafetyMode] = useState(true);
    const [emergencyAlert, setEmergencyAlert] = useState(false);
    const [shareLocation, setShareLocation] = useState(false);
    const [sosPressed, setSosPressed] = useState(false);
    const [activeZone, setActiveZone] = useState<string | null>(null);
    const [incident, setIncident] = useState("");

    // ── Search ──
    const [emergencySearch, setEmergencySearch] = useState("");
    const [safeZoneSearch, setSafeZoneSearch] = useState("");

    // ── Auto check-in ──
    const [checkInInterval, setCheckInInterval] = useState(60);
    const [autoCheckInActive, setAutoCheckInActive] = useState(false);
    const [nextCheckIn, setNextCheckIn] = useState<number | null>(null);   // seconds remaining
    const checkInTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Live location ──
    const [locationStatus, setLocationStatus] = useState<"idle" | "sharing" | "error">("idle");
    const wsRef = useRef<WebSocket | null>(null);
    const locationWatchRef = useRef<number | null>(null);

    // ─── Load trips on mount ───────────────────────────────────────────────────
    useEffect(() => {
        api.trips.list()
            .then((raw: any[]) => {
                const mapped = raw.map(mapBackendTrip);
                setTrips(mapped);
                if (mapped.length) setSelectedTripId(mapped[0].id);
            })
            .catch((err) => {
                console.error("Could not load trips:", err);
                // Leave trips empty — UI will show "no trip selected" guidance
            });
    }, []);

    // ─── Derived data ─────────────────────────────────────────────────────────
    // Only look up data when a real trip is selected (countryCode !== "DEFAULT")
    const tripSelected = !!selectedTrip;
    const emergencyNumbers = tripSelected
        ? (EMERGENCY_DB[countryCode] ?? { country: selectedTrip!.country, flag: selectedTrip!.flag ?? "🌍", police: "112", ambulance: "112", fire: "112" })
        : null;

    const allEmergencyNumbers = Object.values(EMERGENCY_DB);
    const filteredEmergency = emergencySearch.trim()
        ? allEmergencyNumbers.filter(n =>
            n.country.toLowerCase().includes(emergencySearch.toLowerCase()) ||
            n.police.includes(emergencySearch) ||
            n.ambulance.includes(emergencySearch)
        )
        : emergencyNumbers ? [emergencyNumbers] : [];   // empty array when no trip

    // Safe zones: only pull real data when a trip is selected
    const rawSafeZones: SafeZone[] = tripSelected
        ? (SAFE_ZONES_DB[countryCode] ?? [])
        : [];
    const filteredSafeZones = safeZoneSearch.trim()
        ? rawSafeZones.filter(z =>
            z.name.toLowerCase().includes(safeZoneSearch.toLowerCase()) ||
            z.city.toLowerCase().includes(safeZoneSearch.toLowerCase()) ||
            z.description.toLowerCase().includes(safeZoneSearch.toLowerCase())
        )
        : rawSafeZones;

    // Safety score: use the trip's safety_score from the backend (set when trip was planned),
    // then boost slightly based on live features enabled.
    const baseScore: number = selectedTrip ? ((selectedTrip as any).safety_score ?? 70) : 0;
    const safetyScore = !tripSelected ? 0
        : Math.min(100, baseScore + (womenSafetyMode ? 5 : 0) + (shareLocation ? 8 : 0));

    // ─── Live Location via WebSocket ──────────────────────────────────────────
    const startLiveLocation = useCallback(() => {
        if (!selectedTrip) { toast.error("Select a trip first"); return; }

        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            return;
        }

        // Open WebSocket to backend
        const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/location`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setLocationStatus("sharing");
            toast.success("📍 Live location sharing started", { description: "Your emergency contacts can see your location." });
        };

        ws.onerror = () => {
            setLocationStatus("error");
            toast.error("WebSocket connection failed", { description: "Falling back to periodic updates." });
            // Fallback: poll every 30s via REST
            startLocationPolling();
        };

        ws.onclose = () => {
            if (locationStatus === "sharing") {
                setLocationStatus("idle");
            }
        };

        // Watch GPS and send updates
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const payload = {
                    type: "location_update",
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: new Date().toISOString(),
                    trip_id: selectedTrip.id,
                };
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(payload));
                }
            },
            (err) => {
                setLocationStatus("error");
                toast.error("Location access denied", { description: "Enable location in your browser settings." });
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );
        locationWatchRef.current = watchId;
    }, [selectedTrip, locationStatus]);

    const startLocationPolling = useCallback(() => {
        if (!selectedTrip) return;
        const poll = () => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    await api.location.update({
                        trip_id: selectedTrip.id,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    });
                    setLocationStatus("sharing");
                } catch { /* silent */ }
            });
        };
        poll();
        const id = setInterval(poll, 30_000);
        checkInTimerRef.current = id;
    }, [selectedTrip]);

    const stopLiveLocation = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (locationWatchRef.current !== null) {
            navigator.geolocation.clearWatch(locationWatchRef.current);
            locationWatchRef.current = null;
        }
        if (checkInTimerRef.current) {
            clearInterval(checkInTimerRef.current);
            checkInTimerRef.current = null;
        }
        setLocationStatus("idle");
        toast.info("📍 Live location sharing stopped");
    }, []);

    const handleShareLocationToggle = (val: boolean) => {
        setShareLocation(val);
        if (val) {
            startLiveLocation();
        } else {
            stopLiveLocation();
        }
    };

    // ─── Auto Check-In ────────────────────────────────────────────────────────
    const startAutoCheckIn = useCallback(() => {
        if (!selectedTrip) { toast.error("Select a trip first"); return; }
        const intervalSecs = checkInInterval * 60;
        setNextCheckIn(intervalSecs);
        setAutoCheckInActive(true);

        // Countdown ticker
        countdownRef.current = setInterval(() => {
            setNextCheckIn(prev => {
                if (prev === null || prev <= 1) return intervalSecs; // reset
                return prev - 1;
            });
        }, 1000);

        // Actual check-in API call
        checkInTimerRef.current = setInterval(async () => {
            try {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    await api.checkin.post({
                        trip_id: selectedTrip.id,
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    });
                    toast.success("✓ Auto check-in sent", { description: "Your contacts know you're safe." });
                }, () => {
                    // No location, check in without coords
                    api.checkin.post({ trip_id: selectedTrip.id }).catch(console.error);
                });
            } catch (e) {
                console.error("Auto check-in failed", e);
            }
        }, intervalSecs * 1000);

        // Tell backend the interval so the missed-check-in watcher can alert contacts
        api.checkin.register(selectedTrip.id, checkInInterval).catch(console.error);

        toast.success(`⏱ Auto check-in set`, { description: `You'll check in every ${checkInInterval} minutes.` });
    }, [selectedTrip, checkInInterval]);

    const stopAutoCheckIn = useCallback(() => {
        if (checkInTimerRef.current) { clearInterval(checkInTimerRef.current); checkInTimerRef.current = null; }
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        api.checkin.unregister().catch(console.error);
        setAutoCheckInActive(false);
        setNextCheckIn(null);
        toast.info("Auto check-in stopped");
    }, []);

    // Cleanup on unmount
    useEffect(() => () => {
        stopLiveLocation();
        stopAutoCheckIn();
    }, []);

    const formatCountdown = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s.toString().padStart(2, "0")}s`;
    };

    // ─── Manual check-in ──────────────────────────────────────────────────────
    const handleManualCheckIn = () => {
        if (!selectedTrip) { toast.error("Select a trip first"); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    await api.checkin.post({ trip_id: selectedTrip.id, lat: pos.coords.latitude, lon: pos.coords.longitude });
                    toast.success("✓ Check-in recorded", { description: "Your contacts know you're safe." });
                } catch { toast.error("Check-in failed. Check your connection."); }
            },
            async () => {
                // Without GPS still send
                try {
                    await api.checkin.post({ trip_id: selectedTrip.id });
                    toast.success("✓ Check-in recorded (no GPS)", { description: "Your contacts know you're safe." });
                } catch { toast.error("Check-in failed."); }
            }
        );
    };

    // ─── SOS ──────────────────────────────────────────────────────────────────
    const handleSOS = () => {
        if (!selectedTrip) { toast.error("Select a trip first"); return; }
        setSosPressed(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await api.sos.trigger({ lat: pos.coords.latitude, lon: pos.coords.longitude, message: "I am in an emergency! Please help.", trip_id: selectedTrip.id });
                toast.error("🚨 SOS Alert Sent!", { description: "Emergency contacts notified with your live location.", duration: 5000 });
            } catch (e: any) {
                toast.error("SOS Failed", { description: e.message || "Could not send alert" });
            } finally {
                setTimeout(() => setSosPressed(false), 3000);
            }
        }, () => {
            toast.error("Location Access Denied", { description: "Cannot send SOS without location access." });
            setTimeout(() => setSosPressed(false), 1000);
        });
    };

    // ─── Nearby Alerts (polling) ──────────────────────────────────────────────
    const alertPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const handleNearbyAlertsToggle = (val: boolean) => {
        setEmergencyAlert(val);
        if (val) {
            if (!selectedTrip) { toast.error("Select a trip first"); setEmergencyAlert(false); return; }
            toast.success("🔔 Nearby alerts enabled", { description: "You'll be notified of incidents near your location." });
            // Poll backend every 2 minutes for alerts near current location
            const poll = () => {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                        const alerts = await api.alerts.nearby({ lat: pos.coords.latitude, lon: pos.coords.longitude, radius_km: 5 });
                        if (alerts?.length) {
                            alerts.forEach((a: { title: string; description: string }) =>
                                toast.warning(`⚠️ ${a.title}`, { description: a.description, duration: 8000 })
                            );
                        }
                    } catch { /* silent polling failure */ }
                });
            };
            poll();
            alertPollRef.current = setInterval(poll, 120_000);
        } else {
            if (alertPollRef.current) { clearInterval(alertPollRef.current); alertPollRef.current = null; }
        }
    };

    // ─── Report Incident ──────────────────────────────────────────────────────
    const handleReportIncident = () => {
        if (!incident.trim()) { toast.error("Please describe the incident"); return; }
        if (!selectedTrip) { toast.error("Select a trip first"); return; }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await api.incidents.report({ trip_id: selectedTrip.id, description: incident, lat: pos.coords.latitude, lon: pos.coords.longitude });
                toast.success("Report submitted", { description: "Sent to local authorities and the community." });
                setIncident("");
            } catch { toast.error("Failed to submit report. Check your connection."); }
        }, async () => {
            try {
                await api.incidents.report({ trip_id: selectedTrip.id, description: incident });
                toast.success("Report submitted (no GPS)", { description: "Sent to local authorities." });
                setIncident("");
            } catch { toast.error("Failed to submit report."); }
        });
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

            {/* ── Hero Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Safety Dashboard</h1>
                                <p className="text-slate-400 text-sm">Your comprehensive travel safety hub</p>
                            </div>
                        </div>

                        {/* ── Trip selector ── */}
                        <div className="mb-4">
                            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                                <SelectTrigger className="w-full md:w-72 bg-white/10 border-white/20 text-white rounded-xl focus:ring-2 focus:ring-white/30">
                                    <SelectValue placeholder="Select a trip…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {trips.length === 0
                                        ? <SelectItem value="__none__" disabled>No trips yet — plan one first!</SelectItem>
                                        : trips.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.flag} {t.title} — {t.destination}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTrip && (
                            <div className="flex items-center gap-2 mb-4 text-sm text-slate-300">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{selectedTrip.destination}</span>
                                <span className="text-slate-500">·</span>
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{selectedTrip.start_date} → {selectedTrip.end_date}</span>
                            </div>
                        )}

                        {/* Safety score */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-green-400" />
                                    <span className="text-sm text-slate-300">Safety score</span>
                                </div>
                                <div className="flex-1 w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${tripSelected ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-white/20"}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: tripSelected ? `${safetyScore}%` : "0%" }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    />
                                </div>
                                <span className={`text-xl font-bold ${tripSelected ? "text-green-400" : "text-slate-500"}`}>
                                    {tripSelected ? `${safetyScore}%` : "—"}
                                </span>
                            </div>
                            {tripSelected && (
                                <p className="text-xs text-slate-500">
                                    Base: {(selectedTrip as any).safety_score ?? 70}
                                    {womenSafetyMode ? " +5 women mode" : ""}
                                    {shareLocation ? " +8 live location" : ""}
                                </p>
                            )}
                            {!tripSelected && (
                                <p className="text-xs text-slate-500">Select a trip to see your safety score</p>
                            )}
                        </div>
                    </div>

                    {/* SOS */}
                    <div className="flex flex-col items-center gap-2">
                        <motion.button
                            onClick={handleSOS}
                            whileTap={{ scale: 0.93 }}
                            animate={sosPressed ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px #ef4444", "0 0 40px #ef4444", "0 0 0px #ef4444"] } : {}}
                            transition={{ duration: 0.5 }}
                            className={`relative h-28 w-28 rounded-full font-black text-white text-sm tracking-widest uppercase
                border-4 ${sosPressed ? "border-red-300 bg-red-600" : "border-red-400/60 bg-gradient-to-br from-red-500 to-red-700"}
                shadow-[0_0_24px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.8)]
                transition-all duration-200 cursor-pointer`}
                        >
                            {sosPressed && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-red-400"
                                    initial={{ scale: 1, opacity: 1 }}
                                    animate={{ scale: 1.6, opacity: 0 }}
                                    transition={{ duration: 0.8, repeat: 2 }}
                                />
                            )}
                            <Bell className="h-6 w-6 mx-auto mb-1" />
                            SOS
                        </motion.button>
                        <p className="text-xs text-slate-400">Tap to send alert</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Women Safety Mode ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden
          ${womenSafetyMode
                        ? "border-pink-300 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20"
                        : "border-border bg-card"}`}
                >
                    <div className="flex items-center justify-between p-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${womenSafetyMode ? "bg-pink-500 shadow-lg shadow-pink-500/30" : "bg-muted"}`}>🌸</div>
                            <div>
                                <h2 className={`text-xl font-bold ${womenSafetyMode ? "text-pink-800 dark:text-pink-200" : ""}`}>Women Safety Mode</h2>
                                <p className="text-sm text-muted-foreground">Unlock verified rides, stays & safety features</p>
                            </div>
                        </div>
                        <Switch checked={womenSafetyMode} onCheckedChange={setWomenSafetyMode} className="data-[state=checked]:bg-pink-500 scale-125" />
                    </div>
                    <AnimatePresence>
                        {womenSafetyMode && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-6">
                                    {WOMEN_FEATURES.map((f, i) => (
                                        <motion.button
                                            key={f.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            whileHover={{ scale: 1.03, y: -2 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur border border-pink-200 dark:border-pink-800 hover:border-pink-400 hover:shadow-md transition-all text-left"
                                        >
                                            <div className="h-9 w-9 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                                                <f.icon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-pink-900 dark:text-pink-100">{f.label}</p>
                                                <p className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-0.5">{f.desc}</p>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Quick Actions Row ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Manual Check In */}
                <Card className="border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Safety Check-In</p>
                                <p className="text-xs text-muted-foreground">Sends GPS + timestamp to contacts</p>
                            </div>
                        </div>
                        <Button onClick={handleManualCheckIn} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl border-0">
                            <Navigation className="h-4 w-4 mr-2" />
                            Check In Now
                        </Button>
                    </CardContent>
                </Card>

                {/* Live Location */}
                <Card className={`border-2 transition-all ${shareLocation ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : "border-border"}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${shareLocation ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
                                    {locationStatus === "sharing" ? (
                                        <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : locationStatus === "error" ? (
                                        <WifiOff className="h-5 w-5 text-red-500" />
                                    ) : (
                                        <Share2 className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Live Location</p>
                                    <p className="text-xs text-muted-foreground">Streams to your contacts</p>
                                </div>
                            </div>
                            <Switch checked={shareLocation} onCheckedChange={handleShareLocationToggle} className="data-[state=checked]:bg-green-500" />
                        </div>
                        <div className={`text-xs px-3 py-2 rounded-lg font-medium ${locationStatus === "sharing" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : locationStatus === "error" ? "bg-red-100 dark:bg-red-900/30 text-red-600"
                                : "bg-muted text-muted-foreground"}`}>
                            {locationStatus === "sharing" ? "✓ Streaming via WebSocket"
                                : locationStatus === "error" ? "⚠ Polling fallback (30s)"
                                    : "Location sharing off"}
                        </div>
                    </CardContent>
                </Card>

                {/* Auto Check-In */}
                <Card className={`border-2 transition-all ${autoCheckInActive ? "border-orange-300 dark:border-orange-700 bg-orange-50/40 dark:bg-orange-950/20" : "border-border hover:border-orange-300"}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${autoCheckInActive ? "bg-orange-100 dark:bg-orange-900/40" : "bg-muted"}`}>
                                <Clock className={`h-5 w-5 ${autoCheckInActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Auto Check-In</p>
                                <p className="text-xs text-muted-foreground">
                                    {autoCheckInActive && nextCheckIn !== null
                                        ? `Next in ${formatCountdown(nextCheckIn)}`
                                        : "Missed check-ins alert contacts"}
                                </p>
                            </div>
                        </div>
                        {!autoCheckInActive ? (
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min={5}
                                    max={480}
                                    placeholder="60"
                                    value={checkInInterval}
                                    onChange={e => setCheckInInterval(Number(e.target.value))}
                                    className="rounded-xl text-center font-bold"
                                />
                                <Button onClick={startAutoCheckIn} className="rounded-xl px-3 shrink-0 bg-orange-500 hover:bg-orange-600 border-0 text-white">
                                    <Clock className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={stopAutoCheckIn} variant="outline" className="w-full rounded-xl border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                                <RefreshCw className="h-4 w-4 mr-2" /> Stop Auto Check-In
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Emergency Contact + Nearby Alerts ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> Emergency Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">Contacts receive your SOS alerts, live location stream, and missed check-in warnings.</p>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => window.location.href = '/dashboard/emergency-contacts'}>
                            <Users className="h-4 w-4 mr-2" /> Manage Contacts
                        </Button>
                    </CardContent>
                </Card>

                <Card className={`border-2 transition-all ${emergencyAlert ? "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20" : "border-border"}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="h-4 w-4 text-amber-500" /> Nearby Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Polls for safety incidents within 5 km of you every 2 mins</p>
                                <p className={`text-xs font-medium mt-1 ${emergencyAlert ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                                    {emergencyAlert ? "🔔 Polling active" : "Alerts off"}
                                </p>
                            </div>
                            <Switch checked={emergencyAlert} onCheckedChange={handleNearbyAlertsToggle} className="data-[state=checked]:bg-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Emergency Numbers ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Emergency Numbers
                        {selectedTrip && <Badge variant="secondary" className="text-xs font-normal">{selectedTrip.flag} {selectedTrip.destination}</Badge>}
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search country or number…"
                            value={emergencySearch}
                            onChange={e => setEmergencySearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>
                </div>

                {filteredEmergency.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Phone className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        {!tripSelected
                            ? <><p className="font-semibold text-base">No trip selected</p><p className="text-sm mt-1">Select a trip above to see emergency numbers for your destination.</p></>
                            : emergencySearch
                                ? <p>No results for "{emergencySearch}"</p>
                                : <p>No emergency numbers available for this destination.</p>
                        }
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                        {filteredEmergency.slice(0, emergencySearch ? 9 : 3).map((c, i) => (
                            <motion.div key={c.country} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06 }} whileHover={{ y: -3 }}>
                                <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${!emergencySearch && c.country === emergencyNumbers?.country ? "ring-2 ring-primary/40" : ""}`}>
                                    <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    <CardHeader className="pb-2 pt-4">
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <div className="flex items-center gap-2"><span className="text-2xl">{c.flag}</span> {c.country}</div>
                                            {!emergencySearch && c.country === emergencyNumbers?.country && (
                                                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Your Trip</Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-3 gap-2 text-center mb-2">
                                            {[
                                                { label: "Police", value: c.police, color: "text-blue-600 dark:text-blue-400" },
                                                { label: "Medical", value: c.ambulance, color: "text-red-600 dark:text-red-400" },
                                                { label: "Fire", value: c.fire, color: "text-orange-600 dark:text-orange-400" },
                                            ].map(item => (
                                                <a key={item.label} href={`tel:${item.value}`} className="bg-muted/50 rounded-xl p-2.5 hover:bg-muted transition-colors block">
                                                    <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{item.label}</p>
                                                </a>
                                            ))}
                                        </div>
                                        {(c.tourismPolice || c.coastGuard) && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {c.tourismPolice && (
                                                    <a href={`tel:${c.tourismPolice}`} className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-2 text-center hover:bg-violet-100 transition-colors">
                                                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{c.tourismPolice}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tourism Police</p>
                                                    </a>
                                                )}
                                                {c.coastGuard && (
                                                    <a href={`tel:${c.coastGuard}`} className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-2 text-center hover:bg-cyan-100 transition-colors">
                                                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{c.coastGuard}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Coast Guard</p>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* ── Safe Zones ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Safe Zones
                        {selectedTrip && <Badge variant="secondary" className="text-xs font-normal">{selectedTrip.flag} {selectedTrip.destination}</Badge>}
                    </h2>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search zones or cities…"
                            value={safeZoneSearch}
                            onChange={e => setSafeZoneSearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>
                </div>

                {filteredSafeZones.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        {!tripSelected
                            ? <><p className="font-semibold text-base">No trip selected</p><p className="text-sm mt-1">Select a trip above to see safe zones for your destination.</p></>
                            : safeZoneSearch
                                ? <p>No zones match "{safeZoneSearch}"</p>
                                : <p>No safe zone data available for this destination yet.</p>
                        }
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                        {filteredSafeZones.map((zone, i) => (
                            <motion.div
                                key={zone.name}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 + i * 0.07 }}
                                whileHover={{ y: -3 }}
                                onClick={() => setActiveZone(activeZone === zone.name ? null : zone.name)}
                            >
                                <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg
                  ${activeZone === zone.name ? "border-2 border-green-400 dark:border-green-600 ring-2 ring-green-400/20" : ""}`}>
                                    <CardContent className="pt-5">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <p className="font-semibold">{zone.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" /> {zone.city}
                                                    <span className="ml-1 capitalize opacity-60">· {zone.type}</span>
                                                </p>
                                            </div>
                                            <Badge className={`text-xs shrink-0 ${zone.rating >= 95 ? "bg-green-500" : zone.rating >= 90 ? "bg-emerald-500" : "bg-teal-500"} text-white border-0`}>
                                                {zone.rating >= 95 ? "Very Safe" : "Safe"}
                                            </Badge>
                                        </div>
                                        <AnimatePresence>
                                            {activeZone === zone.name && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="text-xs text-muted-foreground mb-3">{zone.description}</p>
                                                    {zone.lat !== 0 && (
                                                        <a
                                                            href={`https://maps.google.com/?q=${zone.lat},${zone.lon}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <Navigation className="h-3 w-3" /> Open in Maps
                                                        </a>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">Safety rating</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">{zone.rating}%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${zone.rating}%` }}
                                                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* ── Report + Community ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid md:grid-cols-2 gap-6">
                <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-orange-500" /> Report an Incident
                        </CardTitle>
                        <CardDescription>Help keep the community safe{selectedTrip ? ` in ${selectedTrip.destination}` : ""}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            placeholder="Describe the safety concern or incident…"
                            rows={3}
                            value={incident}
                            onChange={e => setIncident(e.target.value)}
                            className="rounded-xl resize-none"
                        />
                        <Button onClick={handleReportIncident} className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0">
                            <Share2 className="h-4 w-4 mr-2" /> Submit Report
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200 dark:border-violet-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" /> Community Support
                        </CardTitle>
                        <CardDescription>Connect with fellow travellers</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <p className="text-sm text-muted-foreground">Real-time updates, shared experiences, peer safety alerts from travellers in {selectedTrip?.destination ?? "your destination"}.</p>
                        <div className="flex -space-x-2 mb-3">
                            {["💁‍♀️", "🧳", "🌏", "🙋‍♀️", "✈️"].map((e, i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-white dark:border-violet-950 flex items-center justify-center text-sm">{e}</div>
                            ))}
                            <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-violet-800 border-2 border-white dark:border-violet-950 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">+2k</div>
                        </div>
                        <Button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0">
                            <Sparkles className="h-4 w-4 mr-2" /> Join Community
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Safety Tips ── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Safety Tips
                    {selectedTrip && <span className="text-base font-normal text-muted-foreground">for {selectedTrip.destination}</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { icon: "💡", title: "Stay in Well-Lit Areas", tip: "Stick to well-populated, lit streets during evening hours.", color: "from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800" },
                        { icon: "✅", title: "Use Verified Transport", tip: "Only use official taxis or ride-sharing with verified drivers.", color: "from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800" },
                        { icon: "📍", title: "Share Your Location", tip: "Keep family or friends updated, especially when travelling alone.", color: "from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800" },
                        { icon: "🧭", title: "Trust Your Instincts", tip: "If a situation feels uncomfortable, remove yourself immediately.", color: "from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800" },
                    ].map((tip, i) => (
                        <motion.div
                            key={tip.title}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.07 }}
                            whileHover={{ x: 4 }}
                            className={`flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${tip.color} transition-all`}
                        >
                            <span className="text-2xl shrink-0">{tip.icon}</span>
                            <div>
                                <p className="font-semibold text-sm">{tip.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{tip.tip}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

        </div>
    );
}
