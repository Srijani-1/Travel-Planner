import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  MapPin, Download, Share2, Sun, CloudSun, Moon,
  AlertCircle, Calendar, Sparkles, Loader2, Hotel, ShieldAlert,
  Phone, ShoppingBag, Music, Tent, ChevronDown,
  ChevronUp, Maximize2, X, Wallet, Star,
  Package, HeartPulse, Utensils, ExternalLink, Ticket,
  TrendingUp, CheckCircle2, Info,
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
  cost?: number;
  booking_platform?: string;
  booking_search_name?: string;
  booking_url?: string;
}

interface StayInfo {
  name: string;
  type: string;
  area: string;
  approx_cost: number | string;
  rating?: number;
  amenities?: string[];
  safety_rating?: "green" | "yellow" | "red";
  booking_platform?: string;
  booking_search_name?: string;
  booking_url?: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  day_budget?: number;
  morning: Activity;
  afternoon: Activity;
  evening: Activity;
  stay: StayInfo;
}

interface HotelOption {
  name: string;
  type: string;
  area: string;
  price_per_night: number | string;
  total_cost: number | string;
  rating: number;
  amenities: string[];
  safety_rating: "green" | "yellow" | "red";
  why_recommended?: string;
  tier?: string;
  fits_budget?: boolean;
  booking_platform?: string;
  booking_search_name?: string;
  booking_url?: string;
}

interface SafetyInfo {
  emergency_contacts: { label: string; number: string }[];
  nearest_police: { name: string; distance: string; address: string };
  nearest_hospital: { name: string; distance: string; address: string };
  nearby_essentials: { label: string; name: string; distance: string; type: string }[];
}

interface SpecialEvent {
  name: string;
  type: "festival" | "concert" | "market" | "exhibition";
  date: string;
  venue: string;
  description: string;
  ticket_price?: number | string;
  booking_platform?: string;
  booking_search_name?: string;
  booking_url?: string;
}

interface CostItem {
  category: string;
  items: { label: string; amount: number; note?: string }[];
  color: string;
  subtotal?: number;
}

interface Restaurant {
  name: string;
  cuisine: string;
  description: string;
  specialty: string;
  avg_cost: number | string;
  dietary_options: string[];
  safety_rating: "green" | "yellow" | "red";
  location?: [number, number];
  booking_platform?: string;
  booking_search_name?: string;
  booking_url?: string;
}

interface TripContent {
  destination: string;
  total_days: number;
  budget_estimate: number | string;
  budget_sufficient?: boolean;
  budget_warning?: string | null;
  minimum_realistic_budget?: number;
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
  people_count?: number;
  travel_style: string;
  preferences: string[];
  itinerary: { content: TripContent };
}

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Helpers ───────────────────────────────────────────────────────────────────
function toNumber(val: number | string | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const n = Number(String(val).replace(/[₹,]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatCost(val: number | string | undefined): string {
  if (val === undefined || val === null) return "—";
  const n = toNumber(val);
  if (n === 0 && val !== 0 && val !== "0") return String(val);
  return `₹${n.toLocaleString("en-IN")}`;
}

// ── Budget Banner ─────────────────────────────────────────────────────────────
function BudgetBanner({
  content,
  userBudget,
}: {
  content: TripContent;
  userBudget: number;
}) {
  const realCost = toNumber(content.budget_estimate);
  const isOver = realCost > userBudget;
  const minBudget = content.minimum_realistic_budget ?? realCost;

  if (!isOver) {
    return (
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Your budget covers this trip
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Estimated cost is{" "}
            <span className="font-black">{formatCost(realCost)}</span> — within your{" "}
            <span className="font-black">{formatCost(userBudget)}</span> budget.
            Prices shown are AI market-rate estimates; verify on booking platforms.
          </p>
        </div>
      </div>
    );
  }

  const overage = realCost - userBudget;
  const pct = Math.round((overage / userBudget) * 100);

  return (
    <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800">
        <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
          <TrendingUp className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-amber-900 dark:text-amber-200">
            Budget Needs Adjustment
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Real market prices for {content.destination} are ~{pct}% above your stated budget
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-bold">Your budget</div>
          <div className="text-lg font-black text-amber-900 dark:text-amber-200 line-through opacity-60">
            {formatCost(userBudget)}
          </div>
        </div>
      </div>

      {/* Budget comparison */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-white dark:bg-black/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Your Budget</div>
          <div className="text-lg font-black text-slate-500 line-through">{formatCost(userBudget)}</div>
        </div>
        <div className="text-center p-3 bg-amber-500 rounded-xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-100 mb-1">Realistic Min</div>
          <div className="text-lg font-black text-white">{formatCost(minBudget)}</div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-black/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Cost</div>
          <div className="text-lg font-black text-slate-900 dark:text-white">{formatCost(realCost)}</div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/30 rounded-xl px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Prices are AI market-rate estimates based on typical {content.destination} rates.
            The itinerary is shown with honest costs — check booking platforms for live prices
            and use the Economy hotel tier to minimize spend.
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Hotel Fits Budget Badge ───────────────────────────────────────────────────
function FitsBadge({ fits, userBudget }: { fits?: boolean; userBudget: number }) {
  if (fits === undefined) return null;
  if (fits) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Fits budget
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
      <TrendingUp className="h-3 w-3" /> Above budget
    </span>
  );
}

// ── Booking URL Builder ───────────────────────────────────────────────────────
function buildBookingUrl(
  platform: string,
  searchName: string,
  destination: string,
  checkIn?: string,
  checkOut?: string,
  guests?: number,
  aiUrl?: string
): string {
  if (
    aiUrl &&
    aiUrl.startsWith("http") &&
    !aiUrl.includes("HOTEL_NAME") &&
    !aiUrl.includes("CITY") &&
    !aiUrl.includes("MAX_PRICE") &&
    !aiUrl.includes("YYYY-MM-DD") &&
    !aiUrl.includes("PEOPLE_COUNT")
  ) {
    return aiUrl;
  }

  const city = encodeURIComponent(destination);
  const name = encodeURIComponent(searchName);
  const g = guests || 1;
  const cin = checkIn || "";
  const cout = checkOut || "";
  const cinDay = cin.slice(8);
  const cinMonth = cin.slice(5, 7);
  const cinYear = cin.slice(0, 4);
  const coutDay = cout.slice(8);
  const coutMonth = cout.slice(5, 7);
  const coutYear = cout.slice(0, 4);
  const cinCompact = cin.replace(/-/g, "");
  const coutCompact = cout.replace(/-/g, "");

  const urls: Record<string, string> = {
    "MakeMyTrip": `https://www.makemytrip.com/hotels/hotel-listing/?checkin=${cinCompact}&checkout=${coutCompact}&city=${city}&searchText=${name}&noOfNights=1&adults=${g}&children=0&rooms=1`,
    "Booking.com": `https://www.booking.com/searchresults.html?ss=${name}+${city}&checkin_monthday=${cinDay}&checkin_month=${cinMonth}&checkin_year=${cinYear}&checkout_monthday=${coutDay}&checkout_month=${coutMonth}&checkout_year=${coutYear}&group_adults=${g}&no_rooms=1`,
    "Airbnb": `https://www.airbnb.co.in/s/${city}/homes?checkin=${cin}&checkout=${cout}&adults=${g}&query=${name}`,
    "Goibibo": `https://www.goibibo.com/hotels/?searchstring=${name}+${city}&checkin=${cinCompact}&checkout=${coutCompact}&adults=${g}`,
    "OYO": `https://www.oyorooms.com/search/?location=${city}&searchTerm=${name}&checkin=${cin}&checkout=${cout}`,
    "Hotels.com": `https://www.hotels.com/search.do?q-destination=${name}+${city}&q-check-in=${cin}&q-check-out=${cout}&q-rooms=1&q-room-0-adults=${g}`,
    "Zomato": `https://www.zomato.com/search?q=${name}&l=${city}`,
    "Swiggy": `https://www.swiggy.com/search?query=${name}`,
    "EazyDiner": `https://www.eazydiner.com/search?q=${name}+${city}`,
    "Dineout": `https://www.dineout.co.in/search?q=${name}+${city}`,
    "BookMyShow": `https://in.bookmyshow.com/explore/events-${destination.toLowerCase().replace(/\s+/g, "-")}?q=${name}`,
    "Insider.in": `https://insider.in/search?query=${name}`,
    "Klook": `https://www.klook.com/en-IN/search/?query=${name}+${city}`,
    "GetYourGuide": `https://www.getyourguide.com/s/?q=${name}+${city}`,
    "Paytm": `https://paytm.com/entertainment/search?search=${name}`,
    "Eventbrite": `https://www.eventbrite.com/d/${destination.toLowerCase().replace(/\s+/g, "-")}/${name}/`,
    "Direct": "",
    "Free": "",
    "None": "",
  };

  return urls[platform] || `https://www.google.com/search?q=${encodeURIComponent(name)}+${city}+hotel+booking`;
}

// ── Booking Button ────────────────────────────────────────────────────────────
function BookingButton({
  platform, searchName, destination, label, compact = false,
  checkIn, checkOut, guests, aiUrl,
}: {
  platform?: string; searchName?: string; destination: string;
  label?: string; compact?: boolean; checkIn?: string;
  checkOut?: string; guests?: number; aiUrl?: string;
}) {
  if (!platform || !searchName || ["None", "Direct", "Free", ""].includes(platform)) return null;
  const url = buildBookingUrl(platform, searchName, destination, checkIn, checkOut, guests, aiUrl);
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
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white ${color} transition-colors`}>
        <ExternalLink className="h-3 w-3" />
        {label || `Book on ${platform}`}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white ${color} transition-colors shadow-sm hover:shadow-md`}>
      <ExternalLink className="h-3.5 w-3.5" />
      {label || `Book on ${platform}`}
    </a>
  );
}

// ── Leaflet Map ───────────────────────────────────────────────────────────────
function EnhancedMap({ center, markers, isMaximized, onToggleMaximize }: {
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
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      markers.forEach(m => {
        const icon = L.divIcon({
          html: `<div style="background:${m.color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:bold">${m.type === "Hotel" ? "H" : m.type === "Dining" ? "R" : "•"}</div>`,
          className: "", iconAnchor: [8, 8],
        });
        if (m.safety) {
          const circleColor = m.safety === "green" ? "#10B981" : m.safety === "yellow" ? "#F59E0B" : "#EF4444";
          L.circle(m.pos, { color: circleColor, fillColor: circleColor, fillOpacity: 0.12, radius: 350, weight: 1 }).addTo(map);
        }
        L.marker(m.pos, { icon }).addTo(map).bindPopup(
          `<div style="font-family:sans-serif;font-size:13px;min-width:160px;padding:4px">
            <strong style="display:block;margin-bottom:2px">${m.text}</strong>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
              <span style="color:${m.color};font-size:11px;font-weight:700;text-transform:uppercase">${m.type}</span>
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
    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return;
    w.document.write(`<html><head><title>Trip Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <style>body{margin:0}#map{height:100vh}</style></head>
      <body><div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map=L.map('map').setView([${center[0]},${center[1]}],13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        ${JSON.stringify(markers)}.forEach(m=>{
          const icon=L.divIcon({html:'<div style="background:'+m.color+';width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"></div>',iconAnchor:[8,8]});
          L.marker(m.pos,{icon}).addTo(map).bindPopup('<strong>'+m.text+'</strong><br/>'+m.type);
          if(m.safety){const c=m.safety==="green"?"#10B981":m.safety==="yellow"?"#F59E0B":"#EF4444";L.circle(m.pos,{color:c,fillColor:c,fillOpacity:0.2,radius:350}).addTo(map);}
        });
      </script></body></html>`);
  };

  return (
    <div className={`relative ${isMaximized ? "fixed inset-0 z-50 bg-black" : ""}`}>
      <div ref={mapRef}
        className={`w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 ${isMaximized ? "h-screen rounded-none" : "h-[320px]"}`} />
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button onClick={openNewWindow} title="Open in new window"
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-white p-2 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all">
          <ExternalLink className="h-4 w-4" />
        </button>
        <button onClick={onToggleMaximize} title={isMaximized ? "Minimize" : "Maximize"}
          className="bg-white dark:bg-slate-900 text-slate-700 dark:text-white p-2 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all">
          {isMaximized ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Safety Badge ──────────────────────────────────────────────────────────────
function SafetyBadge({ level }: { level?: "green" | "yellow" | "red" }) {
  if (!level) return null;
  const map = {
    green: { label: "Safe", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
    yellow: { label: "Moderate", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
    red: { label: "Caution", bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  };
  const s = map[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

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

function EventIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    festival: <Tent className="h-4 w-4" />,
    concert: <Music className="h-4 w-4" />,
    market: <ShoppingBag className="h-4 w-4" />,
    exhibition: <Star className="h-4 w-4" />,
  };
  return <>{icons[type] || <Calendar className="h-4 w-4" />}</>;
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SectionHeader({ icon, title, subtitle, accent = "pink" }: {
  icon: React.ReactNode; title: string; subtitle?: string; accent?: string;
}) {
  const colors: Record<string, string> = {
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${colors[accent] || colors.pink}`}>
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
        setTrip(await res.json());
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
      [{ t: "Morning", v: day.morning }, { t: "Afternoon", v: day.afternoon }, { t: "Evening", v: day.evening }].forEach(a => {
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

  const content: TripContent | null = (trip.itinerary as any)?.content || null;

  if (!content) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Itinerary is still being prepared</h2>
      <p className="text-slate-500 mb-6">Your personalized journey is being crafted by our travel experts.</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
        <Button onClick={() => navigate("/dashboard/my-trips")}>Back to My Trips</Button>
      </div>
    </div>
  );

  const safetyColors: Record<string, string> = { green: "#10B981", yellow: "#F59E0B", red: "#EF4444" };

  const activityMarkers = content.days.flatMap(day =>
    [day.morning, day.afternoon, day.evening]
      .filter(act => act?.location && act.location[0] !== 0 && act.location[1] !== 0)
      .map(act => ({
        pos: act.location as [number, number],
        text: act.activity,
        color: safetyColors[act.safety_level ?? "green"],
        type: act.safety_level === "red" ? "Use Caution" : act.safety_level === "yellow" ? "Moderate" : "Safe Zone",
        safety: act.safety_level ?? "green",
      }))
  );

  const restaurantMarkers = (content.restaurants ?? [])
    .filter(r => r.location && r.location[0] !== 0 && r.location[1] !== 0)
    .map(r => ({
      pos: r.location as [number, number],
      text: r.name,
      color: "#F59E0B",
      type: "Dining",
      safety: r.safety_rating ?? "green",
    }));

  const mapMarkers = [...activityMarkers, ...restaurantMarkers];

  const firstValidLocation = content.days
    .flatMap(d => [d.morning, d.afternoon, d.evening])
    .find(a => a?.location && a.location[0] !== 0 && a.location[1] !== 0)?.location;
  const mapCenter: [number, number] = firstValidLocation ?? [20.5937, 78.9629];

  const costBreakdown = content.cost_breakdown ?? [];
  // grandTotal = sum of cost_breakdown (which now reflects REAL costs from AI)
  const grandTotal = costBreakdown.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + (i.amount || 0), 0),
    0
  );
  // Fall back to budget_estimate from AI if cost_breakdown is missing
  const realTotal = grandTotal || toNumber(content.budget_estimate);
  const isOverBudget = realTotal > trip.budget;

  const checkIn = trip.start_date?.slice(0, 10);
  const checkOut = trip.end_date?.slice(0, 10);
  const guests = trip.people_count || 1;

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

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-none px-3">
                AI-Generated
              </Badge>
              <Badge variant="outline" className="border-slate-200 dark:border-white/10 px-3">
                <Calendar className="h-3 w-3 mr-1.5" />{content.total_days} Days
              </Badge>
              {isOverBudget && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-none px-3 gap-1">
                  <TrendingUp className="h-3 w-3" /> Budget Adjustment Needed
                </Badge>
              )}
            </div>
            <h1 className="font-black leading-tight break-words" style={{ fontSize: "clamp(1.8rem, 5vw, 4.5rem)" }}>
              Trip to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-indigo-600 dark:from-pink-400 dark:to-indigo-400">
                {content.destination}&nbsp;
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>
              Realistic estimate:{" "}
              <span className={`font-semibold ${isOverBudget ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                {formatCost(realTotal)}
              </span>
              {isOverBudget && (
                <span className="text-slate-400 line-through ml-2 text-sm">
                  your budget: {formatCost(trip.budget)}
                </span>
              )}
              {" · "}{content.total_days} days{" · "}{trip.preferences?.join(", ")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownload}
              className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button className="h-12 px-8 rounded-2xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap gap-3 mt-4">
          {trip.preferences?.map(p => (
            <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Sparkles className="h-3 w-3 text-pink-500" /> {p}
            </div>
          ))}
        </div>

        {/* Budget Banner — always shown, honest */}
        <div className="mt-5">
          <BudgetBanner content={content} userBudget={trip.budget} />
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">

          {/* Section Nav */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10">
            {navItems.map(n => (
              <button key={n.id} onClick={() => setActiveSection(n.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${activeSection === n.id
                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
                {n.icon} {n.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* DAILY PLAN */}
            {activeSection === "plan" && (
              <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <SectionHeader icon={<Calendar className="h-5 w-5" />} title="Daily Plan" subtitle="Your day-by-day schedule" accent="pink" />
                {content.days.map((day, di) => (
                  <Card key={day.day} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                    <button className="w-full text-left" onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}>
                      <div className="px-8 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400 mb-1">Day {day.day}</div>
                          <div className="font-bold text-lg text-slate-900 dark:text-white">{day.theme}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {day.day_budget != null && (
                            <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-xl">
                              {formatCost(day.day_budget)}
                            </span>
                          )}
                          <Badge variant="outline" className="opacity-60 text-xs">{day.date}</Badge>
                          {expandedDay === day.day ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedDay === day.day && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                          <CardContent className="p-8 space-y-10">
                            {[
                              { icon: Sun, label: "Morning", act: day.morning },
                              { icon: CloudSun, label: "Afternoon", act: day.afternoon },
                              { icon: Moon, label: "Evening", act: day.evening },
                            ].map((period, i) => {
                              const actId = `${day.day}-${period.act?.activity}`;
                              const isExcluded = disabledActivities.includes(actId);
                              if (!period.act) return null;
                              return (
                                <div key={i} className={`flex gap-6 relative group transition-opacity ${isExcluded ? "opacity-40" : ""}`}>
                                  {i < 2 && <div className="absolute left-[13px] top-8 w-px h-full bg-slate-200 dark:bg-white/10 group-hover:bg-pink-300 transition-colors" />}
                                  <button onClick={e => { e.stopPropagation(); setDisabledActivities(prev => prev.includes(actId) ? prev.filter(x => x !== actId) : [...prev, actId]); }}
                                    className="h-7 w-7 rounded-full bg-white dark:bg-slate-900 border-2 border-pink-500 dark:border-pink-500/50 flex items-center justify-center shrink-0 z-10 hover:scale-110 transition-transform">
                                    {isExcluded ? <X className="h-3 w-3 text-slate-400" /> : <period.icon className="h-3.5 w-3.5 text-pink-500" />}
                                  </button>
                                  <div className="space-y-2 pb-2 flex-1">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{period.label}</span>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className={`text-[9px] ${isExcluded ? "bg-slate-200" : "bg-emerald-50 text-emerald-600"}`}>
                                          {isExcluded ? "Excluded" : "Included"}
                                        </Badge>
                                        <SafetyBadge level={period.act.safety_level} />
                                        {period.act.entry_ticket && period.act.entry_ticket !== "Not Required" && period.act.entry_ticket !== "Free" && (
                                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                            <Ticket className="h-3 w-3" /> {period.act.entry_ticket}
                                          </span>
                                        )}
                                        {period.act.cost != null && period.act.cost > 0 && (
                                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                                            {formatCost(period.act.cost)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <h4 className={`text-base font-bold transition-colors ${isExcluded ? "line-through text-slate-400" : "group-hover:text-pink-600 dark:group-hover:text-pink-400"}`}>
                                      {period.act.activity}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                      <MapPin className="h-3 w-3" /> {period.act.place_name}
                                      {period.act.distance_km != null && (
                                        <span className="ml-1 text-slate-300 dark:text-slate-600">• {period.act.distance_km} km</span>
                                      )}
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xl">{period.act.description}</p>
                                    {period.act.tips && (
                                      <div className="flex items-start gap-2 pt-1 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-3 py-2 border border-amber-100 dark:border-amber-900/20">
                                        <span className="text-sm">💡</span>
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 italic leading-relaxed">{period.act.tips}</span>
                                      </div>
                                    )}
                                    {period.act.booking_platform && !["None", "Direct", "Free", ""].includes(period.act.booking_platform) && (
                                      <div className="pt-1">
                                        <BookingButton
                                          platform={period.act.booking_platform}
                                          searchName={period.act.booking_search_name || period.act.place_name}
                                          destination={content.destination}
                                          label={`Book on ${period.act.booking_platform}`}
                                          aiUrl={period.act.booking_url}
                                          compact
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Overnight Stay */}
                            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 flex gap-4 items-center flex-wrap">
                              <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-sm text-lg">🏨</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-500 mb-1">Overnight Stay</div>
                                <div className="font-bold text-slate-900 dark:text-white">{day.stay.name} • {day.stay.area}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                                  {formatCost(day.stay.approx_cost)}/night
                                  <span className="text-slate-400 ml-2 font-normal text-[10px]">Market rate estimate</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <SafetyBadge level={day.stay.safety_rating} />
                                <BookingButton
                                  platform={day.stay.booking_platform}
                                  searchName={day.stay.booking_search_name || day.stay.name}
                                  destination={content.destination}
                                  checkIn={day.date}
                                  checkOut={content.days[Math.min(di + 1, content.days.length - 1)]?.date || checkOut}
                                  guests={guests}
                                  aiUrl={day.stay.booking_url}
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

            {/* HOTELS */}
            {activeSection === "hotels" && (
              <motion.div key="hotels" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader
                  icon={<Hotel className="h-5 w-5" />}
                  title="Hotels & Stays"
                  subtitle="3 tiers at real market rates — prices verified by AI against typical rates"
                  accent="blue"
                />

                {/* Market rate notice */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Prices below reflect <strong>real market rates</strong> for {content.destination}.
                    Click a booking button to see live availability — actual prices may vary by date and availability.
                    {isOverBudget && (
                      <span className="text-amber-600 dark:text-amber-400 font-bold ml-1">
                        Consider the Economy tier or adjusting your budget to{" "}
                        {formatCost(content.minimum_realistic_budget ?? realTotal)}.
                      </span>
                    )}
                  </p>
                </div>

                {!content.hotels?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No hotel data. Try regenerating your itinerary.</div>
                )}

                <div className="grid gap-5">
                  {content.hotels?.map((hotel, idx) => {
                    const hotelTotal = toNumber(hotel.total_cost);
                    const fitsUserBudget = hotel.fits_budget ?? (hotelTotal <= trip.budget);
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
                        <Card onClick={() => setSelectedHotel(idx)}
                          className={`cursor-pointer border-2 rounded-3xl overflow-hidden transition-all hover:shadow-md
                            ${selectedHotel === idx
                              ? "border-pink-400 dark:border-pink-500/60 bg-pink-50/30 dark:bg-pink-900/10"
                              : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5"}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="h-14 w-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">🏨</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{hotel.name}</h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline" className="text-xs border-slate-200 dark:border-white/10">{hotel.type}</Badge>
                                      {hotel.tier && (
                                        <Badge className={`text-xs border-none font-black ${hotel.tier === "Economy" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" :
                                            hotel.tier === "Standard" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" :
                                              "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                                          }`}>{hotel.tier}</Badge>
                                      )}
                                      <span className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{hotel.area}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <SafetyBadge level={hotel.safety_rating} />
                                    <FitsBadge fits={fitsUserBudget} userBudget={trip.budget} />
                                    {selectedHotel === idx && (
                                      <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-none text-xs">Selected</Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-3"><StarRating rating={hotel.rating} /></div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {hotel.amenities?.map(a => (
                                    <span key={a} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">{a}</span>
                                  ))}
                                </div>
                                {hotel.why_recommended && (
                                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2">
                                    ✨ {hotel.why_recommended}
                                  </p>
                                )}

                                {/* Price block */}
                                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                                  <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                      <div className="text-xs text-slate-400 mb-0.5">Per night (market rate)</div>
                                      <div className="font-black text-xl text-slate-900 dark:text-white">{formatCost(hotel.price_per_night)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-slate-400 mb-0.5">Total ({content.total_days} nights)</div>
                                      <div className={`font-black text-xl ${fitsUserBudget ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                        {formatCost(hotel.total_cost)}
                                      </div>
                                    </div>
                                  </div>
                                  {!fitsUserBudget && (
                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                                      <TrendingUp className="h-3 w-3 shrink-0" />
                                      <span>
                                        This exceeds your stated budget of {formatCost(trip.budget)} by{" "}
                                        <strong>{formatCost(hotelTotal - trip.budget)}</strong>.
                                        This is the real market rate — consider adjusting your budget.
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {hotel.booking_platform && (
                                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                    <BookingButton
                                      platform={hotel.booking_platform}
                                      searchName={hotel.booking_search_name || hotel.name}
                                      destination={content.destination}
                                      checkIn={checkIn}
                                      checkOut={checkOut}
                                      guests={guests}
                                      aiUrl={hotel.booking_url}
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

            {/* PACKING */}
            {activeSection === "packing" && (
              <motion.div key="packing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader icon={<Package className="h-5 w-5" />} title="Smart Packing List" subtitle="Curated for your destination & travel style" accent="amber" />
                <Card className="rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4"><span className="text-xl">🏔️</span><h3 className="font-bold">Destination Essentials</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {content.packing_tips?.map((item, ii) => <PackingItem key={ii} label={item} />)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4"><span className="text-xl">💊</span><h3 className="font-bold">Health & Safety</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Personal medications", "First aid kit", "Sunscreen SPF 50+", "Insect repellent", "ORS sachets", "Hand sanitizer"].map((item, ii) => <PackingItem key={ii} label={item} />)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4"><span className="text-xl">📱</span><h3 className="font-bold">Tech & Documents</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Power bank (10,000+ mAh)", "Universal adapter", "Copies of ID & permits", "Offline maps downloaded", "Emergency contacts saved", "Travel insurance docs"].map((item, ii) => <PackingItem key={ii} label={item} />)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* SAFETY */}
            {activeSection === "safety" && (
              <motion.div key="safety" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader icon={<ShieldAlert className="h-5 w-5" />} title="Safety & Emergency" subtitle="Contacts, essentials and safe zones" accent="rose" />
                {!content.safety_info ? (
                  <div className="text-center py-12 text-slate-400 text-sm">Safety info not generated. Try regenerating your itinerary.</div>
                ) : (
                  <>
                    <Card className="rounded-3xl border-2 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Phone className="h-4 w-4 text-red-500" /> Emergency Contacts</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {content.safety_info.emergency_contacts.map((c, i) => (
                            <a key={i} href={`tel:${c.number}`}
                              className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 hover:border-red-300 transition-all group">
                              <div>
                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.label}</div>
                                <div className="text-lg font-black text-red-600 dark:text-red-400">{c.number}</div>
                              </div>
                              <Phone className="h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="rounded-3xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">Nearest Police</div>
                          </div>
                          <div className="font-bold">{content.safety_info.nearest_police.name}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {content.safety_info.nearest_police.distance}</div>
                          <div className="text-xs text-slate-400 mt-1">{content.safety_info.nearest_police.address}</div>
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
                          <div className="font-bold">{content.safety_info.nearest_hospital.name}</div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {content.safety_info.nearest_hospital.distance}</div>
                          <div className="text-xs text-slate-400 mt-1">{content.safety_info.nearest_hospital.address}</div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5">
                      <CardContent className="p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-amber-500" /> Nearby Essentials</h3>
                        <div className="space-y-3">
                          {content.safety_info.nearby_essentials.map((e, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm text-sm">
                                  {e.type === "pharmacy" ? "💊" : e.type === "store" ? "🛒" : e.type === "atm" ? "🏧" : "🏥"}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{e.label}</div>
                                  <div className="text-sm font-semibold">{e.name}</div>
                                </div>
                              </div>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">{e.distance}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    {content.safety_tips?.length > 0 && (
                      <Card className="rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10">
                        <CardContent className="p-6">
                          <h3 className="font-bold mb-4">🛡️ Safety Tips</h3>
                          <div className="space-y-3">
                            {content.safety_tips.map((t, i) => (
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

            {/* DINING */}
            {activeSection === "dining" && (
              <motion.div key="dining" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader icon={<Utensils className="h-5 w-5" />} title="Dining & Restaurants" subtitle="Matching your dietary preferences" accent="amber" />
                {!content.restaurants?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No restaurant data. Try regenerating your itinerary.</div>
                )}
                <div className="grid gap-5">
                  {content.restaurants?.map((rest, i) => {
                    const isSelected = selectedRes.includes(i);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card onClick={() => setSelectedRes(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                          className={`cursor-pointer border-2 rounded-3xl overflow-hidden hover:shadow-md transition-all
                            ${isSelected ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10" : "border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5"}`}>
                          <CardContent className="p-6">
                            <div className="flex gap-5 items-start">
                              <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                                {isSelected ? "✅" : "🍴"}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-lg">{rest.name}</h3>
                                      <SafetyBadge level={rest.safety_rating} />
                                    </div>
                                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">{rest.cuisine}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-400">Avg Cost</div>
                                    <div className="font-bold">{formatCost(rest.avg_cost)}</div>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{rest.description}</p>
                                <div className="flex flex-wrap gap-4 items-center mb-4">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Sparkles className="h-3 w-3 text-amber-500" />
                                    <span className="font-bold uppercase tracking-widest text-[9px]">Specialty:</span>
                                    <span className="text-slate-700 dark:text-slate-300">{rest.specialty}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {rest.dietary_options?.map(opt => (
                                      <Badge key={opt} variant="outline" className="px-2 py-0 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none">{opt}</Badge>
                                    ))}
                                  </div>
                                </div>
                                {rest.booking_platform && (
                                  <div onClick={e => e.stopPropagation()}>
                                    <BookingButton
                                      platform={rest.booking_platform}
                                      searchName={rest.booking_search_name || rest.name}
                                      destination={content.destination}
                                      aiUrl={rest.booking_url}
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

            {/* EVENTS */}
            {activeSection === "events" && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader icon={<Music className="h-5 w-5" />} title="Special Events & Festivals" subtitle="Happening during your trip" accent="violet" />
                {!content.special_events?.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">No events found for your travel dates.</div>
                )}
                <div className="grid gap-5">
                  {content.special_events?.map((event, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`h-1.5 w-full ${event.type === "festival" ? "bg-gradient-to-r from-amber-400 to-orange-500" : event.type === "concert" ? "bg-gradient-to-r from-violet-500 to-pink-500" : event.type === "market" ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-blue-400 to-indigo-500"}`} />
                        <CardContent className="p-6">
                          <div className="flex gap-4 items-start">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0
                              ${event.type === "festival" ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600" : event.type === "concert" ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600" : event.type === "market" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600"}`}>
                              <EventIcon type={event.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                  <Badge variant="outline" className="text-xs mb-2 capitalize">{event.type}</Badge>
                                  <h3 className="font-bold text-lg leading-tight">{event.name}</h3>
                                </div>
                                {event.ticket_price != null && (
                                  <div className="text-right shrink-0">
                                    <div className="text-xs text-slate-400">Entry</div>
                                    <div className={`font-bold ${event.ticket_price === 0 || event.ticket_price === "Free" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                                      {event.ticket_price === 0 || event.ticket_price === "Free" ? "Free" : formatCost(event.ticket_price as number)}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.date}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.venue}</span>
                              </div>
                              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
                              {event.booking_platform && !["Free", "Direct", ""].includes(event.booking_platform) && (
                                <div className="mt-4">
                                  <BookingButton
                                    platform={event.booking_platform}
                                    searchName={event.booking_search_name || event.name}
                                    destination={content.destination}
                                    aiUrl={event.booking_url}
                                    label={event.ticket_price === 0 || event.ticket_price === "Free" ? `Find on ${event.booking_platform}` : `Buy Tickets on ${event.booking_platform}`}
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

            {/* COSTS */}
            {activeSection === "costs" && (
              <motion.div key="costs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <SectionHeader
                  icon={<Wallet className="h-5 w-5" />}
                  title="Realistic Cost Breakdown"
                  subtitle={isOverBudget
                    ? `Realistic cost: ${formatCost(realTotal)} · Your budget: ${formatCost(trip.budget)}`
                    : `Estimated ${formatCost(realTotal)} of your ${formatCost(trip.budget)} budget`}
                  accent="emerald"
                />

                {!costBreakdown.length && (
                  <div className="text-center py-12 text-slate-400 text-sm">Cost breakdown not generated. Try regenerating.</div>
                )}

                {/* Budget gauge */}
                <Card className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {isOverBudget ? "Budget gap" : "Budget utilization"}
                      </span>
                      <span className={`text-sm font-black ${isOverBudget ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {formatCost(realTotal)} / {formatCost(trip.budget)}
                      </span>
                    </div>

                    {/* Two-segment bar: user budget (slate) + overage (amber) */}
                    <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((Math.min(realTotal, trip.budget) / (isOverBudget ? realTotal : trip.budget)) * 100, 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className="absolute h-full left-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      />
                      {isOverBudget && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((realTotal - trip.budget) / realTotal) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="absolute h-full right-0 bg-amber-400 rounded-r-full"
                        />
                      )}
                    </div>

                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                      <span>₹0</span>
                      {isOverBudget && <span className="text-amber-500">{formatCost(trip.budget)} (your budget)</span>}
                      <span>{formatCost(realTotal)}</span>
                    </div>

                    {!isOverBudget && realTotal > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        ✓ {formatCost(trip.budget - realTotal)} remaining buffer
                      </p>
                    )}
                    {isOverBudget && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                        ↑ Consider increasing budget by {formatCost(realTotal - trip.budget)} or switching to Economy accommodation
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {costBreakdown.map((cat, ci) => {
                    const catTotal = cat.items.reduce((s, i) => s + (i.amount || 0), 0);
                    return (
                      <Card key={ci} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full" style={{ background: cat.color }} />
                              <h3 className="font-bold">{cat.category}</h3>
                            </div>
                            <span className="font-black text-lg">₹{catTotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="space-y-2">
                            {cat.items.map((item, ii) => (
                              <div key={ii} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                                <div>
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                                  {item.note && <span className="ml-2 text-xs text-slate-400 italic">({item.note})</span>}
                                </div>
                                <span className={`text-sm font-bold ${item.amount === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                                  {item.amount === 0 ? "Free" : `₹${item.amount.toLocaleString("en-IN")}`}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }}
                              animate={{ width: realTotal > 0 ? `${(catTotal / realTotal) * 100}%` : "0%" }}
                              transition={{ duration: 0.6, delay: ci * 0.1 }}
                              className="h-full rounded-full" style={{ background: cat.color }} />
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {realTotal > 0 ? Math.round((catTotal / realTotal) * 100) : 0}% of total
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Grand total card */}
                {realTotal > 0 && (
                  <Card className={`rounded-3xl border-2 ${isOverBudget ? "border-amber-400 dark:border-amber-600 bg-amber-900" : "border-slate-900 dark:border-white/20 bg-slate-900 dark:bg-white/5"}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                            {isOverBudget ? "Realistic Total (above your budget)" : "Estimated Total"}
                          </div>
                          <div className={`text-3xl font-black ${isOverBudget ? "text-amber-300" : "text-white"}`}>
                            {formatCost(realTotal)}
                          </div>
                          {isOverBudget && (
                            <div className="text-xs text-slate-400 mt-1">
                              Your stated budget: <span className="line-through">{formatCost(trip.budget)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400 mb-1">Per day average</div>
                          <div className={`text-xl font-bold ${isOverBudget ? "text-amber-300" : "text-pink-400"}`}>
                            {formatCost(Math.round(realTotal / content.total_days))}
                          </div>
                          {isOverBudget && (
                            <div className="text-xs text-slate-400 mt-1">
                              Min. budget needed: {formatCost(content.minimum_realistic_budget ?? realTotal)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Right: Map + Stats ── */}
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
                <EnhancedMap center={mapCenter} markers={mapMarkers} isMaximized={mapMaximized} onToggleMaximize={() => setMapMaximized(m => !m)} />
                <div className="mt-4 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Safety Legend</div>
                  {[
                    { color: "#10B981", label: "Safe Zone", desc: "Well-lit, populated" },
                    { color: "#F59E0B", label: "Moderate", desc: "Normal caution" },
                    { color: "#EF4444", label: "Caution", desc: "Avoid after dark" },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                      <span className="text-xs font-bold text-slate-300">{l.label}</span>
                      <span className="text-[10px] text-slate-500">· {l.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Days", value: `${content.total_days}`, icon: "📅" },
                { label: "Activities", value: `${content.total_days * 3}`, icon: "🎯" },
                {
                  label: isOverBudget ? "Needed/Day" : "Budget/Day",
                  value: formatCost(Math.round(realTotal / content.total_days)),
                  icon: isOverBudget ? "⚠️" : "💰",
                },
                { label: "Events", value: `${content.special_events?.length ?? 0}`, icon: "🎉" },
              ].map((s, i) => (
                <div key={i} className={`p-4 rounded-2xl border text-center ${i === 2 && isOverBudget ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"}`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className={`font-black text-lg ${i === 2 && isOverBudget ? "text-amber-700 dark:text-amber-300" : "text-slate-900 dark:text-white"}`}>{s.value}</div>
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

function PackingItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button onClick={() => setChecked(c => !c)}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all w-full
        ${checked ? "bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10" : "hover:bg-white/60 dark:hover:bg-white/5"}`}>
      <div className={`rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600"}`}
        style={{ minWidth: "18px", height: "18px" }}>
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
