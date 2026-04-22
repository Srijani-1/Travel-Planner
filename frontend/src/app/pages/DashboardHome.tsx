import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Plus, TrendingUp, CheckCircle2, Bookmark, Globe, Shield, Home, Download, Cloud, Loader2, MapPin, Badge } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useDashboardStats, useRecommendations } from "../../hooks/useDashboard";
import { useDestinationImage } from "../../hooks/useDestinationImage";

// ─── Weather Widget ───────────────────────────────────────────────────────────
const weatherIcons: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️",
  61: "🌦️", 63: "🌧️", 80: "🌧️", 95: "⛈️",
};
const weatherLabel: Record<number, string> = {
  0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 61: "Light rain", 63: "Rain", 80: "Showers", 95: "Storm",
};

function WeatherWidget({ city, lat, lon }: { city: string; lat: number; lon: number }) {
  const [wx, setWx] = useState<any>(null);
  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&timezone=auto&forecast_days=4`
    ).then(r => r.json()).then(setWx).catch(() => { });
  }, [lat, lon]);

  if (!wx) return (
    <div className="flex items-center justify-center h-24 text-[10px] text-muted-foreground bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse">
      Loading weather…
    </div>
  );
  const cur = wx.current_weather;
  const daily = wx.daily;
  return (
    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white h-auto shadow-xl relative overflow-hidden group">
      <p className="text-[10px] opacity-70 mb-0.5 font-black uppercase tracking-widest">{city}</p>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{weatherIcons[cur.weathercode] ?? "🌡️"}</span>
        <div>
          <p className="text-3xl font-black leading-none">{Math.round(cur.temperature)}°</p>
          <p className="text-[10px] opacity-90 mt-0.5 font-bold">
            {weatherLabel[cur.weathercode] ?? "—"} · <span className="opacity-70">WIND {Math.round(cur.windspeed)} KM/H</span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 border-t border-white/20 pt-3">
        {daily.time.slice(0, 4).map((date: string, i: number) => (
          <div key={date} className="text-center">
            <p className="text-[8px] font-black opacity-60 uppercase mb-0.5">
              {new Date(date).toLocaleDateString("en", { weekday: "short" })}
            </p>
            <p className="text-lg my-0.5">{weatherIcons[daily.weathercode[i]] ?? "🌡️"}</p>
            <p className="text-[9px] font-bold opacity-90">
              {Math.round(daily.temperature_2m_max[i])}°
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="relative group"
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${color} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
      <Card className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
            </div>
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Recommendation Card Wrapper ──────────────────────────────────────────────
function RecommendationCard({ trip, index, navigate }: { trip: any; index: number; navigate: any }) {
  const { src, loading } = useDestinationImage(
    // Use image_query from AI, fallback to destination name
    trip.image_query ?? trip.destination,
    // Generic travel fallback while loading
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800"
  );

  const tagColorMap: Record<string, string> = {
    Beach: "from-cyan-400 to-blue-500",
    Culture: "from-purple-400 to-pink-500",
    Food: "from-orange-400 to-red-500",
    Adventure: "from-green-400 to-teal-500",
    Nature: "from-lime-400 to-green-500",
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
    >
      <Card className="overflow-hidden border border-white/40 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-3xl h-full flex flex-col ring-1 ring-black/5">
        <div className="relative h-52 overflow-hidden mx-3 mt-3 rounded-2xl">
          {/* Loading shimmer */}
          {loading && <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 animate-pulse z-10" />}
          <img
            src={src}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800";
            }}
          />
          <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors duration-500" />
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow text-foreground">
            {trip.duration}
          </div>
          <div className={`absolute top-3 left-3 bg-gradient-to-r ${tagColorMap[trip.tag] ?? "from-blue-400 to-indigo-500"} px-3 py-1 rounded-full text-xs font-bold text-white shadow`}>
            {trip.tag}
          </div>
          {trip.women_safe && (
            <div className="absolute bottom-3 left-3 bg-pink-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow">
              🌸 Women-safe
            </div>
          )}
        </div>
        <CardHeader className="pt-5 pb-2">
          <CardTitle className="text-lg font-bold tracking-tight">{trip.destination}</CardTitle>
          <CardDescription>{trip.description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto pb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Est. Budget</span>
            <span className="font-bold text-green-600 dark:text-green-400 text-sm">{trip.budget}</span>
          </div>
          <Button variant="outline" className="w-full rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300 border-2"
            onClick={() => navigate(`/dashboard/plan-trip?destination=${encodeURIComponent(trip.destination)}`)}>
            Plan This Trip
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardHome() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { recs, loading: recsLoading } = useRecommendations();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const firstUpcoming = stats?.upcoming_trips?.[0];

  const tagColorMap: Record<string, string> = {
    Beach: "from-cyan-500 to-blue-600",
    Culture: "from-purple-500 to-pink-600",
    Food: "from-orange-500 to-red-600",
    Adventure: "from-emerald-500 to-teal-600",
    Nature: "from-lime-500 to-green-600",
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-1 uppercase italic leading-tight">
            Hi, {user.full_name?.split(' ')[0] || 'Traveler'}! 🌍
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium">Ready for your next safe adventure?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Button
            onClick={() => navigate("/dashboard/plan-trip")}
            className="rounded-2xl px-8 py-6 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-lg shadow-xl shadow-pink-500/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
          >
            Plan New Trip
            <MapPin className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={MapPin}
          label="Planned"
          value={stats?.trips_planned || 0}
          color="from-blue-600 to-indigo-600"
          delay={0.1}
        />
        <StatCard
          icon={Badge}
          label="Visited"
          value={stats?.trips_completed || 0}
          color="from-emerald-600 to-teal-600"
          delay={0.2}
        />
        <StatCard
          icon={Bookmark}
          label="Saved"
          value={stats?.saved_places || 0}
          color="from-amber-500 to-orange-600"
          delay={0.3}
        />
        <StatCard
          icon={Globe}
          label="Regions"
          value={stats?.countries_visited || 0}
          color="from-violet-600 to-purple-700"
          delay={0.4}
        />
      </div>

      {/* ── Upcoming Trips + Weather ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div className="lg:col-span-2 space-y-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Your Adventures</h2>
            <Button variant="link" onClick={() => navigate("/dashboard/my-trips")} className="font-bold text-pink-600 text-xs uppercase tracking-widest">View All</Button>
          </div>

          <div className="flex flex-col gap-4">
            {statsLoading ? (
              <div className="h-32 w-full bg-slate-100 dark:bg-white/5 rounded-3xl animate-pulse" />
            ) : stats?.upcoming_trips?.length > 0 ? (
              stats.upcoming_trips.map((trip: any, i: number) => (
                <Card key={i} className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-slate-200 dark:border-white/10 shadow hover:shadow-xl transition-all duration-300 cursor-pointer rounded-3xl group"
                  onClick={() => navigate(`/dashboard/trips/${trip.id}`)}>
                  <CardContent className="py-6 px-7 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${trip.status === "next" ? "from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20" : "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-750"}`}>
                        <MapPin className={`h-7 w-7 ${trip.status === "next" ? "text-white" : "text-slate-400"}`} />
                      </div>
                      <div>
                        <p className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter">{trip.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">{trip.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${trip.status === "next" ? "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300 border border-pink-200 dark:border-pink-800" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"}`}>
                        {trip.status === "next" ? "★ Upcoming Next" : "Planned Item"}
                      </span>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{trip.days_left} days away</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                <p className="text-slate-500 dark:text-slate-400 font-bold">No upcoming trips. <button onClick={() => navigate("/dashboard/plan-trip")} className="text-pink-600 underline">Plan one!</button></p>
              </div>
            )}

            {/* Safety Banner */}
            <div className="rounded-3xl p-6 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-200 dark:border-pink-800/50 flex items-center justify-between gap-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm">
                  <Shield className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="font-black text-pink-900 dark:text-pink-300 uppercase tracking-tighter">Women's Safety Protocol Active</p>
                  <p className="text-xs text-pink-700/70 dark:text-pink-400/70 font-bold uppercase tracking-widest mt-1">Verified rides, stays & SOS contacts linked</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate("/dashboard/safe-ride")} className="bg-pink-600 hover:bg-pink-700 text-white font-black rounded-xl px-6">
                SOS
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Weather */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Nearby Context</h2>
          {firstUpcoming ? (
            <WeatherWidget city={firstUpcoming.name} lat={firstUpcoming.lat || 19.0760} lon={firstUpcoming.lon || 72.8777} />
          ) : (
            <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-2xl text-center border border-dashed border-slate-300 dark:border-white/10">
              <Cloud className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase text-slate-400">Weather will appear when you plan a trip</p>
            </div>
          )}
          <Card className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border-0 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Pro Tip</p>
            <p className="font-bold text-sm leading-relaxed">Always check the local 'Women Only' transportation laws in {firstUpcoming?.name.split(',')[0] || 'your destination'} before arriving.</p>
          </Card>
        </motion.div>
      </div>

      {/* ── Recommendations ── */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="space-y-8 pb-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Recommended For You</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">AI-curated based on your history</p>
        </div>

        {recsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-[400px] bg-slate-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recs.map((trip: any, index: number) => (
              <RecommendationCard key={index} trip={trip} index={index} navigate={navigate} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}