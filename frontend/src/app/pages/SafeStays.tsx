import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, MapPin, Star, Heart, CheckCircle2, Loader2, Globe, Calendar, Shield } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function SafeStays() {
    const [filter, setFilter] = useState<'all' | 'Women-only' | 'Women-preferred'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [location, setLocation] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [stays, setStays] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState<Set<number>>(new Set());

    const fetchStays = async (loc?: string) => {
        setLoading(true);
        try {
            const params: any = {};
            if (filter !== 'all') params.stay_type = filter;
            if (loc || location) params.location = loc || location;
            if (checkIn) params.check_in = checkIn;
            if (checkOut) params.check_out = checkOut;

            const data = await api.stays.list(params);
            setStays(data);
        } catch (e) {
            setStays([]);
            toast.error("Failed to fetch stays");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location) fetchStays();
    }, [filter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) {
            toast.error("Please enter a city or area");
            return;
        }
        setLocation(searchTerm);
        fetchStays(searchTerm);
    };

    const toggleSave = async (stay: any) => {
        if (saved.has(stay.id)) {
            setSaved(prev => { const s = new Set(prev); s.delete(stay.id); return s; });
        } else {
            try {
                await api.savedPlaces.save({
                    name: stay.name,
                    lat: stay.lat ?? 0,
                    lon: stay.lon ?? 0,
                    category: "hotel",
                    notes: stay.location,
                    image_url: stay.image_url || `https://source.unsplash.com/featured/?hotel,room&sig=${stay.id}`,
                });
                setSaved(prev => new Set(prev).add(stay.id));
                toast.success(`Saved ${stay.name}`);
            } catch (e) {
                toast.error("Failed to save stay");
            }
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2.5 rounded-2xl bg-pink-600 shadow-xl shadow-pink-500/20">
                        <Home className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Safe Stays</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Curated accommodations verified for solo female safety & premium comfort.
                </p>
            </motion.div>

            {/* Search Box */}
            <Card className="p-2 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-black/5">
                <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-stretch gap-2">
                    <div className="flex-1 relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500" />
                        <input
                            type="text"
                            placeholder="Where are you heading? (e.g. Paris, Tokyo)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-6 h-16 bg-transparent focus:outline-none font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-bold border-0"
                        />
                    </div>

                    <div className="h-full w-px bg-slate-100 dark:bg-white/5 hidden lg:block" />

                    <div className="flex items-center gap-2 px-4 lg:w-96">
                        <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                        <div className="grid grid-cols-2 gap-2 flex-1">
                            <div className="space-y-0.5">
                                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Check In</label>
                                <input
                                    type="date"
                                    value={checkIn}
                                    onChange={e => setCheckIn(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 p-2 rounded-xl text-xs font-bold focus:outline-none"
                                />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest pl-1">Check Out</label>
                                <input
                                    type="date"
                                    value={checkOut}
                                    onChange={e => setCheckOut(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-white/5 p-2 rounded-xl text-xs font-bold focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-16 lg:px-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-[2rem] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Globe className="h-5 w-5" /> Explore Stays</>}
                    </button>
                </form>
            </Card>

            {/* AI Filter Toggles */}
            <div className="flex flex-wrap gap-3">
                {(['all', 'Women-only', 'Women-preferred'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-8 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm
              ${filter === f
                                ? 'bg-pink-600 text-white border-pink-700 shadow-pink-500/30'
                                : 'bg-white dark:bg-white/5 text-slate-500 border-slate-100 dark:border-white/5 hover:border-pink-300'}`}
                    >
                        {f === 'all' ? 'Everywhere' : f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
                        <Shield className="h-6 w-6 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl">Curating Best Matches...</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Verifying safety scores for {searchTerm || 'destination'}</p>
                    </div>
                </div>
            ) : stays.length === 0 ? (
                <div className="text-center py-32 space-y-4">
                    <div className="h-24 w-24 bg-slate-100 dark:bg-white/5 mx-auto rounded-[2rem] flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">No stays listed yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Try searching for a city to see AI-verified recommendations</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {stays.map((stay, i) => (
                        <motion.div key={stay.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="group bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="relative h-64 overflow-hidden mx-4 mt-4 rounded-[2.2rem] bg-slate-100 dark:bg-slate-900 shadow-inner">
                                <img src={stay.image_url || `https://loremflickr.com/800/600/hotel,room?random=${stay.id}`}
                                    alt={stay.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 font-bold flex items-center justify-center italic text-slate-400"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800" }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl
                                        ${stay.stay_type === 'Women-only' ? 'bg-pink-600 text-white' : 'bg-indigo-600 text-white'}`}>
                                        {stay.stay_type === 'Women-only' ? '♀ Only' : '♀ Ladies First'}
                                    </span>
                                </div>
                                <button onClick={() => toggleSave(stay)}
                                    className="absolute top-4 right-4 h-10 w-10 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-full flex items-center justify-center text-slate-900 dark:text-white shadow-2xl transition-all hover:scale-110 active:scale-95">
                                    <Heart className={`h-5 w-5 ${saved.has(stay.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                                </button>
                                {stay.rating >= 4.5 && (
                                    <div className="absolute bottom-4 right-4 bg-emerald-500/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white shadow-2xl uppercase tracking-widest">
                                        Solo-Female Approved ★
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight uppercase line-clamp-1">{stay.name}</h3>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-2">
                                        <MapPin className="h-3.5 w-3.5 text-pink-600" /> {stay.location}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(stay.badges || ["Safe Zone", "Verified", "WiFi"]).map((badge: string) => (
                                        <span key={badge} className="text-[9px] font-black bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5 uppercase tracking-widest">
                                            {badge}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/2 p-4 -mx-8 -mb-8 rounded-b-[3rem]">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Per Night</span>
                                        <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{stay.price_per_night ?? "$120"}</span>
                                    </div>
                                    <Button className="rounded-[1.5rem] py-8 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold uppercase tracking-widest text-xs shadow-2xl shadow-black/10 dark:shadow-white/5"
                                        onClick={() => stay.booking_url && window.open(stay.booking_url, '_blank')}
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
