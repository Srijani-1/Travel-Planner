import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Progress } from "../components/ui/progress";
import {
    Shield, Phone, MapPin, AlertTriangle, CheckCircle2,
    Users, Bell, Heart, Share2, Navigation, Clock,
    Car, BedDouble, Sparkles, ChevronRight, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function Safety() {
    const [womenSafetyMode, setWomenSafetyMode] = useState(true);
    const [emergencyAlert, setEmergencyAlert] = useState(false);
    const [shareLocation, setShareLocation] = useState(true);
    const [emergencyContact, setEmergencyContact] = useState("");
    const [checkInTime, setCheckInTime] = useState("60");
    const [incident, setIncident] = useState("");
    const [sosPressed, setSosPressed] = useState(false);
    const [activeZone, setActiveZone] = useState<string | null>(null);

    const safetyScore = womenSafetyMode && shareLocation ? 95 : shareLocation ? 82 : 68;

    const emergencyContacts = [
        { country: "France", flag: "🇫🇷", police: "17", ambulance: "15", fire: "18" },
        { country: "Japan", flag: "🇯🇵", police: "110", ambulance: "119", fire: "119" },
        { country: "Indonesia", flag: "🇮🇩", police: "110", ambulance: "118", fire: "113" },
    ];

    const safeZones = [
        { name: "Le Marais District", city: "Paris", rating: 95, description: "Well-patrolled, well-lit, cafes open late." },
        { name: "Shibuya Center", city: "Tokyo", rating: 98, description: "24/7 activity, excellent public safety." },
        { name: "Seminyak Beach", city: "Bali", rating: 88, description: "Tourist-friendly with regular security patrols." },
    ];

    const womenFeatures = [
        { icon: Car, label: "Women-only Rides", desc: "Verified female drivers only", route: "/dashboard/safe-ride" },
        { icon: BedDouble, label: "Safe Stays", desc: "Women-verified accommodations", route: "/dashboard/safe-stays" },
        { icon: MapPin, label: "Safe Zone Map", desc: "Well-lit, patrolled areas highlighted", route: "#" },
        { icon: Users, label: "Community Support", desc: "Traveller network & peer alerts", route: "#" },
    ];

    const handleSOS = () => {
        setSosPressed(true);
        setTimeout(() => setSosPressed(false), 3000);
        toast.error("🚨 SOS Alert Sent!", {
            description: "Emergency contacts notified with your live location.",
            duration: 5000,
        });
    };

    const handleCheckIn = () => {
        toast.success("✓ Check-in recorded", {
            description: "Your contacts know you're safe.",
        });
    };

    const handleReportIncident = () => {
        if (!incident.trim()) { toast.error("Please describe the incident"); return; }
        toast.success("Report submitted", { description: "Sent to local authorities." });
        setIncident("");
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

            {/* ── Hero Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
            >
                {/* decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1>Safety Dashboard</h1>
                                <p className="text-slate-400 text-sm">Your comprehensive travel safety hub</p>
                            </div>
                        </div>

                        {/* Safety score inline */}
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-green-400" />
                                <span className="text-sm text-slate-300">Safety score</span>
                            </div>
                            <div className="flex-1 w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${safetyScore}%` }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                />
                            </div>
                            <span className="text-xl font-bold text-green-400">{safetyScore}%</span>
                        </div>
                    </div>

                    {/* SOS button — the hero action */}
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
                        <p className="text-xs text-slate-400">Hold to send alert</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Women Safety Mode — featured prominently ── */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className={`rounded-3xl border-2 transition-all duration-300 overflow-hidden
            ${womenSafetyMode
                            ? "border-pink-300 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/20"
                            : "border-border bg-card"
                        }`}
                    >
                        {/* toggle header */}
                        <div className="flex items-center justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl
                  ${womenSafetyMode ? "bg-pink-500 shadow-lg shadow-pink-500/30" : "bg-muted"}`}>
                                    🌸
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold ${womenSafetyMode ? "text-pink-800 dark:text-pink-200" : ""}`}>
                                        Women Safety Mode
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Unlock verified rides, stays & safety features
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={womenSafetyMode}
                                onCheckedChange={setWomenSafetyMode}
                                className="data-[state=checked]:bg-pink-500 scale-125"
                            />
                        </div>

                        {/* feature tiles — only visible when mode is on */}
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
                                        {womenFeatures.map((f, i) => (
                                            <motion.button
                                                key={f.label}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                className="flex flex-col items-start gap-2 p-4 rounded-2xl
                          bg-white/70 dark:bg-white/5 backdrop-blur
                          border border-pink-200 dark:border-pink-800
                          hover:border-pink-400 hover:shadow-md transition-all text-left"
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
            </AnimatePresence>

            {/* ── Quick Actions Row ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {/* Check In */}
                <Card className="border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg group">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Safety Check-In</p>
                                <p className="text-xs text-muted-foreground">Let contacts know you're safe</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleCheckIn}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl border-0"
                        >
                            <Navigation className="h-4 w-4 mr-2" />
                            Check In Now
                        </Button>
                    </CardContent>
                </Card>

                {/* Share Location */}
                <Card className={`border-2 transition-all ${shareLocation ? "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20" : "border-border"}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${shareLocation ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
                                    <Share2 className={`h-5 w-5 ${shareLocation ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Live Location</p>
                                    <p className="text-xs text-muted-foreground">Share with contacts</p>
                                </div>
                            </div>
                            <Switch checked={shareLocation} onCheckedChange={setShareLocation} className="data-[state=checked]:bg-green-500" />
                        </div>
                        <div className={`text-xs px-3 py-2 rounded-lg font-medium ${shareLocation ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                            {shareLocation ? "✓ Location sharing active" : "Location sharing off"}
                        </div>
                    </CardContent>
                </Card>

                {/* Auto Check-In */}
                <Card className="border-2 border-border hover:border-orange-300 transition-all">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Auto Check-In</p>
                                <p className="text-xs text-muted-foreground">Interval in minutes</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="60"
                                value={checkInTime}
                                onChange={(e) => setCheckInTime(e.target.value)}
                                className="rounded-xl text-center font-bold"
                            />
                            <Button variant="outline" className="rounded-xl px-3 shrink-0">
                                <Clock className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Emergency Contact + Alerts row ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" /> Emergency Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            className="rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground mt-2">This contact receives your SOS alerts and location</p>
                    </CardContent>
                </Card>

                <Card className={`border-2 transition-all ${emergencyAlert ? "border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20" : "border-border"}`}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bell className="h-4 w-4 text-amber-500" /> Nearby Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Get notified of safety incidents</p>
                            <p className={`text-xs font-medium mt-1 ${emergencyAlert ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                                {emergencyAlert ? "🔔 Alerts enabled" : "Alerts off"}
                            </p>
                        </div>
                        <Switch checked={emergencyAlert} onCheckedChange={setEmergencyAlert} className="data-[state=checked]:bg-amber-500" />
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Emergency Numbers ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" /> Emergency Numbers
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {emergencyContacts.map((c, i) => (
                        <motion.div
                            key={c.country}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.08 }}
                            whileHover={{ y: -3 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-all duration-200">
                                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                <CardHeader className="pb-2 pt-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="text-2xl">{c.flag}</span> {c.country}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            { label: "Police", value: c.police, color: "text-blue-600 dark:text-blue-400" },
                                            { label: "Medical", value: c.ambulance, color: "text-red-600 dark:text-red-400" },
                                            { label: "Fire", value: c.fire, color: "text-orange-600 dark:text-orange-400" },
                                        ].map(item => (
                                            <div key={item.label} className="bg-muted/50 rounded-xl p-2.5">
                                                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ── Safe Zones ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Safe Zones
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {safeZones.map((zone, i) => (
                        <motion.div
                            key={zone.name}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + i * 0.08 }}
                            whileHover={{ y: -3 }}
                            onClick={() => setActiveZone(activeZone === zone.name ? null : zone.name)}
                        >
                            <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg
                ${activeZone === zone.name ? "border-2 border-green-400 dark:border-green-600 ring-2 ring-green-400/20" : ""}`}
                            >
                                <CardContent className="pt-5">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <p className="font-semibold">{zone.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3 w-3" /> {zone.city}
                                            </p>
                                        </div>
                                        <Badge className={`text-xs shrink-0 ${zone.rating >= 95 ? "bg-green-500" : zone.rating >= 90 ? "bg-emerald-500" : "bg-teal-500"
                                            } text-white border-0`}>
                                            {zone.rating >= 95 ? "Very Safe" : "Safe"}
                                        </Badge>
                                    </div>
                                    <AnimatePresence>
                                        {activeZone === zone.name && (
                                            <motion.p
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="text-xs text-muted-foreground mb-3 overflow-hidden"
                                            >
                                                {zone.description}
                                            </motion.p>
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
            </motion.div>

            {/* ── Report + Community row ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid md:grid-cols-2 gap-6"
            >
                {/* Report Incident */}
                <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Report an Incident
                        </CardTitle>
                        <CardDescription>Help keep the community safe</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            placeholder="Describe the safety concern or incident..."
                            rows={3}
                            value={incident}
                            onChange={(e) => setIncident(e.target.value)}
                            className="rounded-xl resize-none"
                        />
                        <Button
                            onClick={handleReportIncident}
                            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Submit Report
                        </Button>
                    </CardContent>
                </Card>

                {/* Community Support */}
                <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-200 dark:border-violet-800 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            Community Support
                        </CardTitle>
                        <CardDescription>Connect with fellow travellers</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Join our network of travellers who look out for each other — real-time updates, shared experiences, peer safety alerts.
                        </p>
                        <div className="flex -space-x-2 mb-3">
                            {["💁‍♀️", "🧳", "🌏", "🙋‍♀️", "✈️"].map((e, i) => (
                                <div key={i} className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-white dark:border-violet-950 flex items-center justify-center text-sm">
                                    {e}
                                </div>
                            ))}
                            <div className="h-8 w-8 rounded-full bg-violet-200 dark:bg-violet-800 border-2 border-white dark:border-violet-950 flex items-center justify-center text-xs font-bold text-violet-700 dark:text-violet-300">
                                +2k
                            </div>
                        </div>
                        <Button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0">
                            <Sparkles className="h-4 w-4 mr-2" />
                            Join Community
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ── Safety Tips — compact horizontal scroll ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
            >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Safety Tips
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
