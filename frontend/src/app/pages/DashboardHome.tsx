import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Plus, TrendingUp, CheckCircle2, Bookmark, Globe, Shield, Home, Download, Cloud } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { useEffect, useState } from "react";

// ─── Weather Widget ───────────────────────────────────────────────────────────
const weatherIcons: Record<number, string> = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 61: "🌦️", 63: "🌧️", 80: "🌧️", 95: "⛈️",
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
        )
            .then(r => r.json())
            .then(d => setWx(d))
            .catch(() => { });
    }, [lat, lon]);

    if (!wx) return (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading weather…
        </div>
    );

    const cur = wx.current_weather;
    const daily = wx.daily;

    return (
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 pink:from-pink-500 pink:to-rose-600 rounded-2xl p-5 text-white h-full shadow-lg">

            <p className="text-xs opacity-70 mb-1 font-medium uppercase tracking-widest">{city}</p>
            <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{weatherIcons[cur.weathercode] ?? "🌡️"}</span>
                <div>
                    <p className="text-4xl font-bold leading-none">{Math.round(cur.temperature)}°C</p>
                    <p className="text-xs opacity-75 mt-1">
                        {weatherLabel[cur.weathercode] ?? "—"} · Wind {Math.round(cur.windspeed)} km/h
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-1 border-t border-white/20 pt-3">
                {daily.time.slice(0, 4).map((date: string, i: number) => (
                    <div key={date} className="text-center">
                        <p className="text-[10px] opacity-60">
                            {new Date(date).toLocaleDateString("en", { weekday: "short" })}
                        </p>
                        <p className="text-lg my-0.5">{weatherIcons[daily.weathercode[i]] ?? "🌡️"}</p>
                        <p className="text-[10px] opacity-80">
                            {Math.round(daily.temperature_2m_max[i])}° / {Math.round(daily.temperature_2m_min[i])}°
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardHome() {
    const navigate = useNavigate();

    const stats = [
        { label: "Trips Planned", value: "12", icon: TrendingUp, gradient: "from-blue-500 to-cyan-500" },
        { label: "Trips Completed", value: "8", icon: CheckCircle2, gradient: "from-green-500 to-emerald-500" },
        { label: "Saved Places", value: "34", icon: Bookmark, gradient: "from-purple-500 to-pink-500" },
        { label: "Countries Visited", value: "6", icon: Globe, gradient: "from-orange-500 to-amber-500" },
    ];

    const quickActions = [
        { icon: Shield, label: "Safe Rides", desc: "Women-only drivers", route: "/dashboard/safe-ride", gradient: "from-pink-500 to-rose-500" },
        { icon: Home, label: "Safe Stays", desc: "Women-verified stays", route: "/dashboard/safe-stays", gradient: "from-purple-500 to-violet-500" },
        { icon: Download, label: "Offline Kit", desc: "Download itinerary", route: "/dashboard/itinerary", gradient: "from-blue-500 to-indigo-500" },
        { icon: Cloud, label: "Weather", desc: "Destination forecast", route: "/dashboard/plan-trip", gradient: "from-teal-500 to-cyan-500" },
    ];

    const upcomingTrips = [
        { name: "Goa, India", date: "Apr 12 – Apr 18", status: "confirmed", daysLeft: 14, flag: "🇮🇳" },
        { name: "Singapore", date: "Jun 3 – Jun 8", status: "planning", daysLeft: 66, flag: "🇸🇬" },
    ];

    const recommendedTrips = [
        {
            id: 1,
            destination: "Bali, Indonesia",
            description: "Based on your love for beaches and culture",
            image: "https://images.unsplash.com/photo-1604741872759-42c077855b3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhJTIwdGVtcGxlfGVufDF8fHx8MTc3MzY5MDMwNHww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "7 days",
            budget: "$1,200 - $1,800",
            tag: "Beach",
            tagColor: "from-cyan-400 to-blue-500",
            womenSafe: true,
        },
        {
            id: 2,
            destination: "Paris, France",
            description: "Perfect for art and culture enthusiasts",
            image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MzczNTUwOXww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "5 days",
            budget: "$1,500 - $2,200",
            tag: "Culture",
            tagColor: "from-purple-400 to-pink-500",
            womenSafe: true,
        },
        {
            id: 3,
            destination: "Tokyo, Japan",
            description: "A foodie's paradise with modern vibes",
            image: "https://images.unsplash.com/photo-1648871647634-0c99b483cb63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFuJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MzcwNTYxNHww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "6 days",
            budget: "$1,800 - $2,500",
            tag: "Food",
            tagColor: "from-orange-400 to-red-500",
            womenSafe: false,
        },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">

            {/* ── Header ── */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-4xl italic">Hello, Traveler 👋</h1>
                    <p className="text-muted-foreground mt-1">Ready to plan your next adventure?</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Button size="lg" onClick={() => navigate("/dashboard/plan-trip")}>
                        <Plus className="h-5 w-5 mr-2" />
                        Plan New Trip
                    </Button>
                </motion.div>
            </div>

            {/* ── Stats (now 4 cards) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        whileHover={{ scale: 1.02, y: -4 }}
                    >
                        <Card className="relative overflow-hidden bg-white/60 dark:bg-zinc-900/60 pink:bg-pink-50/60 backdrop-blur-xl border-white/40 dark:border-white/10 pink:border-pink-200 shadow-lg ring-1 ring-black/5 hover:shadow-2xl transition-all duration-300 group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 pink:group-hover:opacity-20 transition-opacity duration-300`} />

                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                                        <stat.icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-8"
            >
                <h2 className="text-xl mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate(action.route)}
                            className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/60 pink:bg-pink-50/60 backdrop-blur-xl border border-white/40 dark:border-white/10 pink:border-pink-200 shadow ring-1 ring-black/5 hover:shadow-lg transition-all duration-200 text-left group"

                        >
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} shrink-0`}>
                                <action.icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{action.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{action.desc}</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* ── Upcoming Trips + Weather (2-col) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* Upcoming trips — takes 2/3 width */}
                <motion.div
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                >
                    <h2 className="text-xl mb-4">Upcoming Schedule</h2>
                    <div className="flex flex-col gap-3">
                        {upcomingTrips.map((trip, i) => (
                            <Card
                                key={i}
                                className="bg-white/60 dark:bg-zinc-900/60 pink:bg-pink-50/60 backdrop-blur-xl border-white/40 dark:border-white/10 pink:border-pink-200 shadow ring-1 ring-black/5 hover:shadow-lg transition-all duration-200"
                            >

                                <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{trip.flag}</span>
                                        <div>
                                            <p className="font-semibold text-base">{trip.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{trip.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${trip.status === "confirmed"
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                                            }`}>
                                            {trip.status === "confirmed" ? "✓ Confirmed" : "⋯ Planning"}
                                        </span>
                                        <p className="text-xs text-muted-foreground">{trip.daysLeft} days away</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Women's Safety Banner */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            className="rounded-2xl p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border border-pink-200 dark:border-pink-800 flex items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-semibold text-pink-800 dark:text-pink-300 text-sm">
                                    🌸 Women-friendly features active
                                </p>
                                <p className="text-xs text-pink-600 dark:text-pink-400 mt-0.5">
                                    Safe Rides, Safe Stays & verified accommodations highlighted
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => navigate("/dashboard/safe-ride")}
                                className="shrink-0 bg-pink-600 hover:bg-pink-700 text-white border-0 rounded-xl"
                            >
                                Explore
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Weather widget — takes 1/3 width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h2 className="text-xl font-bold mb-4">Destination Weather</h2>
                    <WeatherWidget city="Bali, Indonesia" lat={-8.3405} lon={115.0920} />
                </motion.div>
            </div>

            {/* ── Recommended Trips ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
            >
                <div className="mb-6">
                    <h2 className="text-xl mb-4">Recommended for You</h2>
                    <p className="text-muted-foreground text-sm">Based on your travel history and preferences</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedTrips.map((trip, index) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        >
                            <Card className="overflow-hidden border border-white/40 dark:border-white/10 pink:border-pink-200 bg-white/60 dark:bg-zinc-900/60 pink:bg-pink-50/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-3xl h-full flex flex-col ring-1 ring-black/5">
                                <div className="relative h-56 overflow-hidden mx-3 mt-3 rounded-2xl">

                                    <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                    <ImageWithFallback
                                        src={trip.image}
                                        alt={trip.destination}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    {/* Duration badge */}
                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow z-20 text-foreground">
                                        {trip.duration}
                                    </div>
                                    {/* Category tag */}
                                    <div className={`absolute top-3 left-3 bg-gradient-to-r ${trip.tagColor} px-3 py-1 rounded-full text-xs font-bold text-white shadow z-20`}>
                                        {trip.tag}
                                    </div>
                                    {/* Women-safe badge */}
                                    {trip.womenSafe && (
                                        <div className="absolute bottom-3 left-3 bg-pink-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow z-20">
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
                                    <Button
                                        variant="outline"
                                        className="w-full rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300 border-2"
                                        onClick={() => navigate("/dashboard/plan-trip")}
                                    >
                                        Plan This Trip
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── Bottom CTA ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-8"
            >
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 pink:from-pink-600 pink:to-rose-600 text-white overflow-hidden relative border-0 shadow-2xl rounded-3xl">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/30 pink:bg-rose-400/30 rounded-full blur-[64px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/30 pink:bg-pink-400/30 rounded-full blur-[64px] pointer-events-none" />
                    <CardContent className="p-10 relative z-10">

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-3xl font-extrabold mb-2 tracking-tight">Ready for Your Next Adventure?</h3>
                                <p className="text-lg opacity-90 text-blue-100">
                                    Let our AI create the perfect itinerary tailored just for you
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                                <Button
                                    size="lg"
                                    onClick={() => navigate("/dashboard/plan-trip")}
                                    className="whitespace-nowrap px-8 py-6 rounded-xl bg-white text-blue-900 hover:scale-105 hover:bg-gray-100 transition-all shadow-xl font-bold border-0"
                                >
                                    Start Planning
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={() => navigate("/dashboard/safe-ride")}
                                    className="whitespace-nowrap px-8 py-6 rounded-xl bg-pink-500 hover:bg-pink-400 text-white transition-all shadow-xl font-bold border-0"
                                >
                                    🌸 Safe Rides
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

        </div>
    );
}