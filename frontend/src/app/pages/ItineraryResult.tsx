import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  MapPin, Clock, Download, Share2, Sun, CloudSun, Moon,
  AlertCircle, Calendar, Sparkles, Loader2, Hotel, ShieldAlert,
  Phone, Hospital, ShoppingBag, Music, Tent, ChevronDown,
  ChevronUp, Maximize2, X, Wallet, CheckSquare, Star,
  Thermometer, Zap, Package, HeartPulse, Utensils, ExternalLink, Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Activity {
  activity: string;
  place_name: string;
  description: string;
  tips: string;
  location?: [number, number];
  safety_level?: "green" | "yellow" | "red";
  distance_km?: number;
  entry_ticket?: string;
  booking_platform?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  stay: {
    name: string;
    type: string;
    area: string;
    approx_cost: string;
    rating?: number;
    amenities?: string[];
    image?: string;
    safety_rating?: "green" | "yellow" | "red";
    booking_platform?: string;
  };
}

interface HotelOption {
  name: string;
  type: string;
  area: string;
  price_per_night: string;
  total_cost: string;
  rating: number;
  amenities: string[];
  safety_rating: "green" | "yellow" | "red";
  image?: string;
  why_recommended?: string;
  booking_platform?: string;
  booking_search_name?: string;
}

interface SafetyInfo {
  emergency_contacts: { label: string; number: string }[];
  nearest_police: { name: string; distance: string; address: string };
  nearest_hospital: { name: string; distance: string; address: string };
  nearby_essentials: { label: string; name: string; distance: string; type: string }[];
  safety_tips: string[];
}

interface SpecialEvent {
  name: string;
  type: "festival" | "concert" | "market" | "exhibition";
  date: string;
  venue: string;
  description: string;
  ticket_price?: string;
  booking_platform?: string;
  booking_search_query?: string;
}

interface CostItem {
  category: string;
  items: { label: string; amount: number; note?: string }[];
  color: string;
}

interface Restaurant {
  name: string;
  cuisine: string;
  description: string;
  specialty: string;
  avg_cost: string;
  dietary_options: string[];
  safety_rating: "green" | "yellow" | "red";
  location?: [number, number];
  booking_platform?: string;
  booking_search_name?: string;
}

interface TripContent {
  destination: string;
  total_days: number;
  budget_estimate: string;
  days: ItineraryDay[];
  hotels?: HotelOption[];
  packing_tips: string[];
  local_tips: string[];
  safety_tips: string[];
  safety_info?: SafetyInfo;
  special_events?: SpecialEvent[];
  cost_breakdown?: CostItem[];
  restaurants?: Restaurant[];
}

interface TripData {
  id: number;
  destination_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  travel_style: string;
  preferences: string[];
  itinerary: { content: TripContent };
}

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Booking URL Builder ───────────────────────────────────────────────────────
function buildBookingUrl(platform: string, searchName: string, destination: string): string {
  const query = encodeURIComponent(`${searchName} ${destination}`);
  const nameOnly = encodeURIComponent(searchName);

  const urls: Record<string, string> = {
    "MakeMyTrip": `https://www.makemytrip.com/hotels/hotel-listing/?checkin=&checkout=&city=${encodeURIComponent(destination)}&searchText=${nameOnly}`,
    "Booking.com": `https://www.booking.com/search.html?ss=${query}`,
    "Airbnb": `https://www.airbnb.co.in/s/${encodeURIComponent(destination)}/homes?query=${nameOnly}`,
    "Goibibo": `https://www.goibibo.com/hotels/?searchstring=${query}`,
    "OYO": `https://www.oyorooms.com/search/?location=${encodeURIComponent(destination)}&searchTerm=${nameOnly}`,
    "Hotels.com": `https://www.hotels.com/search.do?q-destination=${query}`,
    "Zomato": `https://www.zomato.com/search?q=${nameOnly}&l=${encodeURIComponent(destination)}`,
    "Swiggy": `https://www.swiggy.com/search?query=${nameOnly}`,
    "EazyDiner": `https://www.eazydiner.com/search?q=${query}`,
    "Dineout": `https://www.dineout.co.in/search?q=${query}`,
    "BookMyShow": `https://in.bookmyshow.com/explore/events-${encodeURIComponent(destination.toLowerCase())}?q=${nameOnly}`,
    "Insider.in": `https://insider.in/search?query=${nameOnly}`,
    "Paytm": `https://paytm.com/entertainment/search?search=${nameOnly}`,
    "Eventbrite": `https://www.eventbrite.com/d/${encodeURIComponent(destination.toLowerCase())}/${nameOnly}/`,
    "Klook": `https://www.klook.com/en-IN/search/?query=${query}`,
    "GetYourGuide": `https://www.getyourguide.com/s/?q=${query}`,
    "Direct": "",
    "Free": "",
    "None": "",
  };

  return urls[platform] || `https://www.google.com/search?q=${query}+booking`;
}

// ── Booking Button ────────────────────────────────────────────────────────────
function BookingButton({
  platform,
  searchName,
  destination,
  label,
  compact = false
}: {
  platform?: string;
  searchName?: string;
  destination: string;
  label?: string;
  compact?: boolean;
}) {
  if (!platform || !searchName || platform === "None" || platform === "Direct") return null;

  const url = buildBookingUrl(platform, searchName, destination);
  if (!url) return null;

  const platformColors: Record<string, string> = {
    "MakeMyTrip": "bg-blue-600 hover:bg-blue-700",
    "Booking.com": "bg-sky-600 hover:bg-sky-700",
    "Airbnb": "bg-rose-500 hover:bg-rose-600",
    "Goibibo": "bg-teal-600 hover:bg-teal-700",
    "OYO": "bg-red-600 hover:bg-red-700",
    "Hotels.com": "bg-orange-600 hover:bg-orange-700",
    "Zomato": "bg-red-500 hover:bg-red-600",
    "Swiggy": "bg-orange-500 hover:bg-orange-600",
    "EazyDiner": "bg-green-600 hover:bg-green-700",
    "Dineout": "bg-purple-600 hover:bg-purple-700",
    "BookMyShow": "bg-pink-600 hover:bg-pink-700",
    "Insider.in": "bg-indigo-600 hover:bg-indigo-700",
    "Klook": "bg-orange-500 hover:bg-orange-600",
    "GetYourGuide": "bg-yellow-500 hover:bg-yellow-600",
    "Paytm": "bg-blue-500 hover:bg-blue-600",
    "Eventbrite": "bg-orange-600 hover:bg-orange-700",
  };

  const color = platformColors[platform] || "bg-slate-700 hover:bg-slate-800";

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${color} transition-colors`}
      >
        <ExternalLink className="h-3 w-3" />
        {label || platform}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white ${color} transition-colors shadow-sm hover:shadow-md`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Book on {platform}
    </a>
  );
}

// ── Leaflet Map (enhanced) ────────────────────────────────────────────────────
function EnhancedMap({
  center, markers, isMaximized, onToggleMaximize
}: {
  center: [number, number];
  markers: { pos: [number, number]; text: string; color: string; type: string; safety?: string }[];
  isMaximized: boolean;
  onToggleMaximize: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    if (!mapRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      const map = L.map(mapRef.current!).setView(center, isMaximized ? 13 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(map);

      markers.forEach(m => {
        const icon = L.divIcon({
          html: `<div style="background:${m.color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;items-center;justify-center;color:white;font-size:9px;font-weight:bold">${m.type === "Hotel" ? "H" : m.type === "Dining" ? "R" : "•"}</div>`,
          className: "", iconAnchor: [8, 8],
        });

        if (m.safety) {
          const circleColor = m.safety === "green" ? "#10B981" : m.safety === "yellow" ? "#F59E0B" : "#EF4444";
          L.circle(m.pos, {
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.15,
            radius: 400,
            weight: 1
          }).addTo(map);
        }

        L.marker(m.pos, { icon }).addTo(map).bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;min-width:160px;padding:4px">
            <strong style="display:block;margin-bottom:2px">${m.text}</strong>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span style="color:${m.color};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">${m.type}</span>
              ${m.safety ? `<span style="width:6px;height:6px;border-radius:50%;background:${m.safety === "green" ? "#10B981" : m.safety === "yellow" ? "#F59E0B" : "#EF4444"}"></span>` : ""}
            </div>
          </div>`
        );
      });
      mapInstance.current = map;
    };
    document.head.appendChild(script);

    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [center, markers, isMaximized]);

  const openNewWindow = () => {
    const mapWindow = window.open("", "_blank", "width=1000,height=800");
    if (!mapWindow) return;
    mapWindow.document.write(`
      <html>
        <head>
          <title>Trip Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>body { margin: 0; } #map { height: 100vh; }</style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const map = L.map('map').setView([${center[0]}, ${center[1]}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            const markers = ${JSON.stringify(markers)};
            markers.forEach(m => {
              const color = m.color;
              const icon = L.divIcon({
                html: '<div style="background:'+color+';width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>',
                iconAnchor: [8, 8]
              });
              L.marker(m.pos, {icon}).addTo(map).bindPopup('<strong>'+m.text+'</strong><br/>'+m.type);
              if (m.safety) {
                const c = m.safety === "green" ? "#10B981" : m.safety === "yellow" ? "#F59E0B" : "#EF4444";
                L.circle(m.pos, {color: c, fillColor: c, fillOpacity: 0.2, radius: 400}).addTo(map);
              }
            });
          </script>
        </body>
      </html>
    `);
  };

  return (
    <div className={`relative ${isMaximized ? "fixed inset-0 z-50 bg-black" : ""}`}>
      <div
        ref={mapRef}
        className={`w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 ${isMaximized ? "h-screen rounded-none" : "h-[320px]"}`}
      />
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={openNewWindow}
          title="Open in new window"
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-white p-2 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleMaximize}
          title={isMaximized ? "Minimize" : "Maximize"}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-white p-2 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
        >
          {isMaximized ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Safety Badge ──────────────────────────────────────────────────────────────
function SafetyBadge({ level }: { level: "green" | "yellow" | "red" }) {
  const map = {
    green: { label: "Safe", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
    yellow: { label: "Moderate", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
    red: { label: "Caution", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" }
  };
  const s = map[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
      ))}
      <span className="ml-1 text-xs font-bold text-slate-500">{rating}</span>
    </div>
  );
}

// ── Event Type Icon ───────────────────────────────────────────────────────────
function EventIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    festival: <Tent className="h-4 w-4" />,
    concert: <Music className="h-4 w-4" />,
    market: <ShoppingBag className="h-4 w-4" />,
    exhibition: <Star className="h-4 w-4" />
  };
  return <>{icons[type] || <Calendar className="h-4 w-4" />}</>;
}

// ── ShieldCheck icon ──────────────────────────────────────────────────────────
function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, accent = "pink" }: {
  icon: React.ReactNode; title: string; subtitle?: string; accent?: string
}) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0
        ${accent === "pink" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" : ""}
        ${accent === "blue" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : ""}
        ${accent === "amber" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : ""}
        ${accent === "emerald" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : ""}
        ${accent === "rose" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : ""}
        ${accent === "violet" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : ""}
      `}>
        {icon}
      </div>
      <div>
        <h2 className="text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ItineraryResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapMaximized, setMapMaximized] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("plan");
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [selectedHotel, setSelectedHotel] = useState<number>(0);
  const [selectedRes, setSelectedRes] = useState<number[]>([]);
  const [disabledActivities, setDisabledActivities] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API}/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("access_token");
          toast.error("Session expired. Please login again.");
          navigate("/");
          return;
        }

        if (!res.ok) throw new Error("Could not find this trip");
        const data = await res.json();
        setTrip(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  const handleDownload = () => {
    if (!trip) return;
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const content = trip.itinerary.content;
    pdf.setFontSize(22); pdf.text(`${content.destination} Itinerary`, 20, 25);
    pdf.setFontSize(10); pdf.text(`Budget: ₹${trip.budget?.toLocaleString()} • ${content.total_days} days`, 20, 33);
    let y = 48;
    content.days.forEach(day => {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setFontSize(14); pdf.setTextColor(219, 39, 119);
      pdf.text(`Day ${day.day}: ${day.theme}`, 20, y); y += 8;
      pdf.setFontSize(10); pdf.setTextColor(40, 40, 40);
      [
        { t: "Morning", v: day.morning },
        { t: "Afternoon", v: day.afternoon },
        { t: "Evening", v: day.evening }
      ].forEach(a => {
        pdf.setFont("helvetica", "bold"); pdf.text(`${a.t}: ${a.v.activity}`, 25, y); y += 5;
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(a.v.description, 160);
        pdf.text(lines, 25, y); y += lines.length * 5 + 3;
        if (y > 270) { pdf.addPage(); y = 20; }
      });
      y += 8;
    });
    pdf.save(`itinerary-${content.destination}.pdf`);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
      <p className="text-slate-500 animate-pulse font-medium">Building your perfect itinerary…</p>
    </div>
  );

  if (error || !trip) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Oops! {error || "Trip not found"}</h2>
      <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );

  // ── Use AI-generated content directly — no hardcoded fallbacks ──────────────
  const content: TripContent | null = (trip.itinerary as any)?.content || null;

  if (!content) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Itinerary is still being prepared</h2>
      <p className="text-slate-500 mb-6">Your personalized journey is being crafted by our travel experts.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>Refresh View</Button>
        <Button onClick={() => navigate("/dashboard/my-trips")}>Back to My Trips</Button>
      </div>
    </div>
  );

  // Build map markers from AI-generated locations
  const safetyColors: Record<string, string> = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444" };

  const activityMarkers = content.days.flatMap((day, di) =>
    [day.morning, day.afternoon, day.evening].map((act, ai) => ({
      pos: (act.location ?? [0, 0]) as [number, number],
      text: act.activity,
      color: safetyColors[act.safety_level ?? "green"],
      type: act.safety_level === "red" ? "Use Caution" : act.safety_level === "yellow" ? "Moderate" : "Safe Zone",
      safety: act.safety_level ?? "green"
    })).filter(m => m.pos[0] !== 0)
  );

  const restaurantMarkers = (content.restaurants ?? [])
    .filter(r => r.location && r.location[0] !== 0)
    .map(rest => ({
      pos: rest.location as [number, number],
      text: rest.name,
      color: "#F59E0B",
      type: "Dining",
      safety: rest.safety_rating ?? "green"
    }));

  const hotelMarkers = (content.hotels ?? []).map((hotel, i) => ({
    pos: [0, 0] as [number, number], // hotels often don't have coordinates; skip or use destination center offset
    text: hotel.name,
    color: "#8B5CF6",
    type: "Hotel",
    safety: hotel.safety_rating ?? "green"
  })).filter(m => m.pos[0] !== 0);

  const mapMarkers = [...activityMarkers, ...restaurantMarkers, ...hotelMarkers];

  // Derive map center from first day's morning activity location, fallback to [0,0]
  const firstLocation = content.days?.[0]?.morning?.location;
  const mapCenter: [number, number] = firstLocation && firstLocation[0] !== 0
    ? firstLocation
    : [20.5937, 78.9629]; // India center as absolute fallback

  // ── Dynamic cost from AI breakdown ─────────────────────────────────────────
  const costBreakdown = content.cost_breakdown ?? [];
  const grandTotal = costBreakdown.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.amount, 0),
    0
  );

  const navItems = [
    { id: "plan", label: "Daily Plan", icon: <Calendar className="h-4 w-4" /> },
    { id: "hotels", label: "Hotels", icon: <Hotel className="h-4 w-4" /> },
    { id: "packing", label: "Packing", icon: <Package className="h-4 w-4" /> },
    { id: "safety", label: "Safety", icon: <ShieldAlert className="h-4 w-4" /> },
    { id: "dining", label: "Dining", icon: <Utensils className="h-4 w-4" /> },
    { id: "events", label: "Events", icon: <Music className="h-4 w-4" /> },
    { id: "costs", label: "Costs", icon: <Wallet className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-none px-3">AI-Generated</Badge>
              <Badge variant="outline" className="border-slate-200 dark:border-white/10 px-3">
                <Calendar className="h-3 w-3 mr-1.5" />
                {content.total_days} Days
              </Badge>
            </div>
            <h1 className="text-4xl lg:text-7xl">
              Adventure in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-indigo-600 dark:from-pink-400 dark:to-indigo-400">
                {content.destination}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              A bespoke journey curated for{" "}
              {trip.budget ? `a budget of ₹${trip.budget.toLocaleString()}` : "your preferences"}.{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">{content.budget_estimate}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownload}
              className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/25">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          {trip.preferences?.map(p => (
            <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Sparkles className="h-3 w-3 text-pink-500" /> {p}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">

        {/* ── Left: Sections ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section Nav */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10">
            {navItems.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveSection(n.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${activeSection === n.id
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
              >
                {n.icon} {n.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════
                SECTION 1 — DAILY PLAN
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "plan" && (
              <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4">
                <SectionHeader icon={<Calendar className="h-5 w-5" />} title="Daily Plan" subtitle="Your day-by-day schedule" accent="pink" />
                {content.days.map((day) => (
                  <Card key={day.day}
                    className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                    >
                      <div className="px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400 mb-1">Day {day.day}</div>
                          <div className="font-bold text-lg text-slate-900 dark:text-white">{day.theme}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="opacity-60 text-xs">{day.date}</Badge>
                          {expandedDay === day.day
                            ? <ChevronUp className="h-5 w-5 text-slate-400" />
                            : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedDay === day.day && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        >
                          <CardContent className="p-8 space-y-10">
                            {[
                              { icon: Sun, label: "Morning", act: day.morning, time: "7:00 – 10:00 AM" },
                              { icon: CloudSun, label: "Afternoon", act: day.afternoon, time: "12:00 – 4:00 PM" },
                              { icon: Moon, label: "Evening", act: day.evening, time: "6:00 – 9:00 PM" }
                            ].map((period, i) => {
                              const actId = `${day.day}-${period.act.activity}`;
                              const isExcluded = disabledActivities.includes(actId);
                              return (
                                <div key={i} className={`flex gap-6 relative group transition-opacity ${isExcluded ? "opacity-40" : ""}`}>
                                  {i < 2 && <div className="absolute left-[13px] top-8 w-px h-full bg-slate-200 dark:bg-white/10 group-hover:bg-pink-300 transition-colors" />}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDisabledActivities(prev =>
                                        prev.includes(actId) ? prev.filter(x => x !== actId) : [...prev, actId]
                                      );
                                    }}
                                    className="h-7 w-7 rounded-full bg-white dark:bg-slate-900 border-2 border-pink-500 dark:border-pink-500/50 flex items-center justify-center shrink-0 z-10 hover:scale-110 transition-transform"
                                  >
                                    {isExcluded ? <X className="h-3 w-3 text-slate-400" /> : <period.icon className="h-3.5 w-3.5 text-pink-500" />}
                                  </button>
                                  <div className="space-y-2 pb-2 flex-1">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{period.label}</span>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={`text-[9px] cursor-pointer ${isExcluded ? "bg-slate-200" : "bg-emerald-50 text-emerald-600"}`}>
                                          {isExcluded ? "Excluded" : "Included"}
                                        </Badge>
                                        {period.act.safety_level && <SafetyBadge level={period.act.safety_level} />}
                                        {period.act.entry_ticket && period.act.entry_ticket !== "Not Required" && (
                                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                            <Ticket className="h-3 w-3" /> {period.act.entry_ticket}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <h4 className={`text-base font-bold transition-colors ${isExcluded ? "line-through text-slate-400" : "group-hover:text-pink-600 dark:group-hover:text-pink-400"}`}>
                                      {period.act.activity}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                      <MapPin className="h-3 w-3" /> {period.act.place_name}
                                      {period.act.distance_km && (
                                        <span className="ml-1 text-slate-300 dark:text-slate-600">• {period.act.distance_km} km away</span>
                                      )}
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xl">{period.act.description}</p>
                                    <div className="flex items-start gap-2 pt-1 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900/20">
                                      <span className="text-sm">💡</span>
                                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400 italic leading-relaxed">
                                        {period.act.tips}
                                      </span>
                                    </div>
                                    {/* Activity booking link */}
                                    {period.act.booking_platform && !["None", "Direct", "Free"].includes(period.act.booking_platform) && (
                                      <div className="pt-1">
                                        <BookingButton
                                          platform={period.act.booking_platform}
                                          searchName={period.act.place_name}
                                          destination={content.destination}
                                          label={`Book tickets on ${period.act.booking_platform}`}
                                          compact
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Overnight Stay inline */}
                            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex gap-4 items-center flex-wrap">
                              <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-lg">🏨</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500 mb-1">Overnight Stay</div>
                                <div className="font-bold text-slate-900 dark:text-white">{day.stay.name} • {day.stay.area}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Approx. {day.stay.approx_cost}</div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {day.stay.safety_rating && <SafetyBadge level={day.stay.safety_rating} />}
                                <BookingButton
                                  platform={day.stay.booking_platform}
                                  searchName={day.stay.name}
                                  destination={content.destination}
                                  compact
                                />
                              </div>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 2 — HOTELS & RESORTS
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "hotels" && (
              <motion.div key="hotels" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<Hotel className="h-5 w-5" />} title="Hotels & Stays"
                  subtitle={`Within your ₹${trip.budget?.toLocaleString()} budget · sorted by recommendation`} accent="blue" />

                {!content.hotels?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No hotel data generated. Try regenerating your itinerary.</div>
                )}

                <div className="grid gap-5">
                  {content.hotels?.map((hotel, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
                      <Card
                        onClick={() => setSelectedHotel(idx)}
                        className={`cursor-pointer border-2 rounded-3xl overflow-hidden transition-all hover:shadow-md
                          ${selectedHotel === idx
                            ? "border-pink-400 dark:border-pink-500/60 bg-pink-50/30 dark:bg-pink-900/10"
                            : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5"
                          }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-14 w-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                              🏨
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{hotel.name}</h3>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs border-slate-200 dark:border-white/10">{hotel.type}</Badge>
                                    <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{hotel.area}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <SafetyBadge level={hotel.safety_rating} />
                                  {selectedHotel === idx && (
                                    <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-none text-xs">Selected</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="mt-3">
                                <StarRating rating={hotel.rating} />
                              </div>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {hotel.amenities.map(a => (
                                  <span key={a} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">{a}</span>
                                ))}
                              </div>

                              {hotel.why_recommended && (
                                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
                                  ✨ {hotel.why_recommended}
                                </p>
                              )}

                              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <span className="text-xs text-slate-400">Per night</span>
                                  <div className="font-bold text-lg text-slate-900 dark:text-white">{hotel.price_per_night}</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-400">Total ({content.total_days} nights)</span>
                                  <div className="font-bold text-lg text-pink-600 dark:text-pink-400">{hotel.total_cost}</div>
                                </div>
                              </div>

                              {/* Booking redirect button */}
                              {hotel.booking_platform && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                  <BookingButton
                                    platform={hotel.booking_platform}
                                    searchName={hotel.booking_search_name || hotel.name}
                                    destination={content.destination}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 3 — SMART PACKING LIST
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "packing" && (
              <motion.div key="packing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<Package className="h-5 w-5" />} title="Smart Packing List"
                  subtitle="Curated for your destination, weather & travel style" accent="amber" />

                {/* Destination-specific items from AI */}
                <Card className="rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🏔️</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">Destination Essentials</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.packing_tips?.map((item, ii) => (
                        <PackingItem key={ii} label={item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Static safety items always useful */}
                <Card className="rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">💊</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">Health & Safety</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Personal medications", "First aid kit", "Sunscreen SPF 50+", "Insect repellent", "ORS sachets", "Hand sanitizer"].map((item, ii) => (
                        <PackingItem key={ii} label={item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">📱</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">Tech & Documents</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Power bank (10,000+ mAh)", "Universal adapter", "Copies of ID & permits", "Offline maps downloaded", "Emergency contacts saved", "Travel insurance docs"].map((item, ii) => (
                        <PackingItem key={ii} label={item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 4 — SAFETY
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "safety" && (
              <motion.div key="safety" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<ShieldAlert className="h-5 w-5" />} title="Safety & Emergency"
                  subtitle="Contacts, essentials and safe zones for your destination" accent="rose" />

                {!content.safety_info && (
                  <div className="text-center py-12 text-slate-400 text-sm">Safety info not generated. Try regenerating your itinerary.</div>
                )}

                {content.safety_info && (
                  <>
                    {/* Emergency Contacts */}
                    <Card className="rounded-3xl border-2 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-red-500" /> Emergency Contacts
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {content.safety_info.emergency_contacts.map((c, i) => (
                            <a key={i} href={`tel:${c.number}`}
                              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-600/50 transition-all group">
                              <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.label}</div>
                                <div className="text-lg font-black text-red-600 dark:text-red-400 tracking-wide">{c.number}</div>
                              </div>
                              <Phone className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Police & Hospital */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="rounded-3xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">Nearest Police</div>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">{content.safety_info.nearest_police.name}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {content.safety_info.nearest_police.distance}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{content.safety_info.nearest_police.address}</div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
                              <HeartPulse className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Nearest Hospital</div>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">{content.safety_info.nearest_hospital.name}</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {content.safety_info.nearest_hospital.distance}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 leading-relaxed">{content.safety_info.nearest_hospital.address}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Nearby Essentials */}
                    <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5">
                      <CardContent className="p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4 text-amber-500" /> Nearby Essentials
                        </h3>
                        <div className="space-y-3">
                          {content.safety_info.nearby_essentials.map((e, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-sm">
                                  {e.type === "pharmacy" ? "💊" : e.type === "store" ? "🛒" : e.type === "atm" ? "🏧" : "🏥"}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{e.label}</div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{e.name}</div>
                                </div>
                              </div>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">
                                {e.distance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Safety Tips from AI */}
                    {content.safety_tips?.length > 0 && (
                      <Card className="rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                        <CardContent className="p-6">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            🛡️ Safety Tips
                          </h3>
                          <div className="space-y-3">
                            {content.safety_tips?.map((t, i) => (
                              <div key={i} className="flex gap-3 items-start bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/80 dark:border-white/5">
                                <div className="h-7 w-7 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{t}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 5 — DINING & RESTAURANTS
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "dining" && (
              <motion.div key="dining" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<Utensils className="h-5 w-5" />} title="Dining & Restaurants"
                  subtitle="Handpicked tables matching your dietary preferences" accent="amber" />

                {!content.restaurants?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No restaurant data generated. Try regenerating your itinerary.</div>
                )}

                <div className="grid gap-5">
                  {content.restaurants?.map((rest, i) => {
                    const isSelected = selectedRes.includes(i);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card
                          onClick={() => setSelectedRes(prev =>
                            prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                          )}
                          className={`cursor-pointer backdrop-blur-xl border-2 rounded-3xl overflow-hidden hover:shadow-md transition-all
                            ${isSelected ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10" : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5"}
                          `}
                        >
                          <CardContent className="p-6">
                            <div className="flex gap-5 items-start">
                              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                                {isSelected ? "✅" : "🍴"}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">{rest.name}</h3>
                                      <SafetyBadge level={rest.safety_rating} />
                                    </div>
                                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">{rest.cuisine}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-400">Avg Cost</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{rest.avg_cost}</div>
                                  </div>
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{rest.description}</p>

                                <div className="flex flex-wrap gap-4 items-center mb-4">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">Specialty:</span>
                                    <span className="text-slate-700 dark:text-slate-300">{rest.specialty}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {rest.dietary_options.map(opt => (
                                      <Badge key={opt} variant="outline" className="px-2 py-0 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none">{opt}</Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Restaurant booking button */}
                                {rest.booking_platform && (
                                  <div onClick={e => e.stopPropagation()}>
                                    <BookingButton
                                      platform={rest.booking_platform}
                                      searchName={rest.booking_search_name || rest.name}
                                      destination={content.destination}
                                      label={`View on ${rest.booking_platform}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 6 — SPECIAL EVENTS
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "events" && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<Music className="h-5 w-5" />} title="Special Events & Festivals"
                  subtitle="Happening during your trip — don't miss these!" accent="violet" />

                {!content.special_events?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No events found for your travel dates.</div>
                )}

                <div className="grid gap-5">
                  {content.special_events?.map((event, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`h-1.5 w-full
                          ${event.type === "festival" ? "bg-gradient-to-r from-amber-400 to-orange-500" : ""}
                          ${event.type === "concert" ? "bg-gradient-to-r from-violet-500 to-pink-500" : ""}
                          ${event.type === "market" ? "bg-gradient-to-r from-emerald-400 to-teal-500" : ""}
                          ${event.type === "exhibition" ? "bg-gradient-to-r from-blue-400 to-indigo-500" : ""}
                        `} />
                        <CardContent className="p-6">
                          <div className="flex gap-4 items-start">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0
                              ${event.type === "festival" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" : ""}
                              ${event.type === "concert" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" : ""}
                              ${event.type === "market" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : ""}
                              ${event.type === "exhibition" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : ""}
                            `}>
                              <EventIcon type={event.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                  <Badge variant="outline" className="text-xs mb-2 capitalize">{event.type}</Badge>
                                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{event.name}</h3>
                                </div>
                                {event.ticket_price && (
                                  <div className="text-right shrink-0">
                                    <div className="text-xs text-slate-400">Entry</div>
                                    <div className={`font-bold ${event.ticket_price === "Free" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                                      {event.ticket_price}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.date}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.venue}</span>
                              </div>
                              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>

                              {/* Event booking button */}
                              {event.booking_platform && !["Free", "Direct"].includes(event.booking_platform) && (
                                <div className="mt-4">
                                  <BookingButton
                                    platform={event.booking_platform}
                                    searchName={event.booking_search_query || event.name}
                                    destination={content.destination}
                                    label={event.ticket_price === "Free" ? `Find on ${event.booking_platform}` : `Buy Tickets on ${event.booking_platform}`}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                SECTION 7 — COST BREAKDOWN  (from AI data)
            ════════════════════════════════════════════════════════════ */}
            {activeSection === "costs" && (
              <motion.div key="costs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6">
                <SectionHeader icon={<Wallet className="h-5 w-5" />} title="Transparent Cost Breakdown"
                  subtitle={`Total estimated: ₹${grandTotal.toLocaleString()} of ₹${trip.budget?.toLocaleString()} budget`} accent="emerald" />

                {!costBreakdown.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">Cost breakdown not generated. Try regenerating your itinerary.</div>
                )}

                {/* Budget utilization bar */}
                {trip.budget && (
                  <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Budget utilization</span>
                        <span className={`text-sm font-black ${grandTotal > trip.budget ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                          ₹{grandTotal.toLocaleString()} / ₹{trip.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((grandTotal / trip.budget) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${grandTotal > trip.budget ? "bg-red-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"}`}
                        />
                      </div>
                      {grandTotal < trip.budget && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                          ✓ ₹{(trip.budget - grandTotal).toLocaleString()} remaining buffer
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Category breakdown — AI generated */}
                <div className="space-y-4">
                  {costBreakdown.map((cat, ci) => {
                    const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
                    return (
                      <Card key={ci} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
                              <h3 className="font-bold text-slate-900 dark:text-white">{cat.category}</h3>
                            </div>
                            <span className="font-black text-lg text-slate-900 dark:text-white">₹{catTotal.toLocaleString()}</span>
                          </div>

                          <div className="space-y-2">
                            {cat.items.map((item, ii) => (
                              <div key={ii} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                                <div>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                                  {item.note && <span className="ml-2 text-xs text-slate-400 italic">({item.note})</span>}
                                </div>
                                <span className={`text-sm font-bold ${item.amount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                                  {item.amount === 0 ? "Included" : `₹${item.amount.toLocaleString()}`}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: grandTotal > 0 ? `${(catTotal / grandTotal) * 100}%` : "0%" }}
                              transition={{ duration: 0.6, delay: ci * 0.1 }}
                              className="h-full rounded-full"
                              style={{ background: cat.color }}
                            />
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {grandTotal > 0 ? Math.round((catTotal / grandTotal) * 100) : 0}% of total
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Grand Total */}
                {grandTotal > 0 && (
                  <Card className="rounded-3xl border-2 border-slate-900 dark:border-white/20 bg-slate-900 dark:bg-white/5">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Estimated Total</div>
                        <div className="text-3xl font-black text-white">₹{grandTotal.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 mb-1">Per day average</div>
                        <div className="text-xl font-bold text-pink-400">₹{Math.round(grandTotal / content.total_days).toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Right: Map + Stats ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="sticky top-8 space-y-5">
            <Card className="bg-slate-900 dark:bg-white/5 text-white border-none rounded-3xl overflow-hidden shadow-xl">
              <CardHeader className="p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-pink-500" /> Map Overview
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">POIs, routes & safety zones</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <EnhancedMap
                  center={mapCenter}
                  markers={mapMarkers}
                  isMaximized={mapMaximized}
                  onToggleMaximize={() => setMapMaximized(m => !m)}
                />

                {/* Map Legend */}
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Safety Legend</div>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { color: "#10B981", label: "Safe Zone", desc: "Well-lit, populated area" },
                      { color: "#F59E0B", label: "Moderate", desc: "Exercise normal caution" },
                      { color: "#EF4444", label: "Caution", desc: "Avoid after dark" }
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                        <div>
                          <span className="text-xs font-bold text-slate-300">{l.label}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">· {l.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local Tips from AI */}
            {content.local_tips?.length > 0 && (
              <Card className="bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
                <CardContent className="p-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">💬 Local Tips</div>
                  <div className="space-y-2">
                    {content.local_tips.slice(0, 4).map((tip, i) => (
                      <div key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex gap-2">
                        <span className="text-pink-500 shrink-0">→</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Days", value: `${content.total_days}`, icon: "📅" },
                { label: "Activities", value: `${content.total_days * 3}`, icon: "🎯" },
                { label: "Budget/Day", value: trip.budget ? `₹${Math.round(trip.budget / content.total_days).toLocaleString()}` : "—", icon: "💰" },
                { label: "Events", value: `${content.special_events?.length ?? 0}`, icon: "🎉" }
              ].map((s, i) => (
                <div key={i} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="font-black text-lg text-slate-900 dark:text-white">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Packing Item with checkbox ────────────────────────────────────────────────
function PackingItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked(c => !c)}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all w-full
        ${checked
          ? "bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10"
          : "hover:bg-white/60 dark:hover:bg-white/5"
        }`}
    >
      <div
        className={`rounded-md border-2 flex items-center justify-center shrink-0 transition-all
          ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}
        style={{ minWidth: "18px", height: "18px" }}
      >
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className={`text-sm transition-all ${checked ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>
        {label}
      </span>
    </button>
  );
}