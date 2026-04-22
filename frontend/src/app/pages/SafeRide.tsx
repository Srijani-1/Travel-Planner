import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../api';

export default function SafeRide() {
    const [sosLoading, setSosLoading] = useState(false);
    const [sosTriggered, setSosTriggered] = useState(false);

    const platforms = [
        {
            name: 'Uber',
            color: 'bg-black',
            text: 'text-white',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
            url: 'https://www.uber.com',
            description: 'Global standard for safety with features like Pin verification, GPS tracking, and 24/7 support.',
            safetyProps: ['PIN Verification', 'Live GPS Tracking', 'Emergency Button']
        },
        {
            name: 'Ola',
            color: 'bg-[#98c222]',
            text: 'text-black',
            logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1200px-Ola_Cabs_logo.svg.png',
            url: 'https://www.olacabs.com',
            description: 'India\'s most popular ride-sharing app with comprehensive safety protocols for women riders.',
            safetyProps: ['OTP Verification', 'In-app SOS', 'Verified Drivers']
        },
        {
            name: 'Rapido',
            color: 'bg-[#ffde00]',
            text: 'text-black',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Rapido_logo.png',
            url: 'https://www.rapido.bike',
            description: 'Quick and affordable bike taxis and auto-rickshaws with real-time ride monitoring.',
            safetyProps: ['Helmets Provided', 'Daily Sanitized', 'Live Tracking']
        }
    ];

    const handleSOS = async () => {
        setSosLoading(true);
        try {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        await api.sos.trigger({
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            message: "Emergency! I need help immediately."
                        });
                        setSosTriggered(true);
                        setSosLoading(false);
                    },
                    async () => {
                        await api.sos.trigger({ lat: 0, lon: 0, message: "Emergency! Location unavailable." });
                        setSosTriggered(true);
                        setSosLoading(false);
                    }
                );
            }
        } catch {
            setSosLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="h-7 w-7 text-pink-600 dark:text-pink-400" />
                    <h1>Safe Rides & SOS</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Book reliable transport through trusted platforms with enhanced safety features.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {platforms.map((platform) => (
                    <motion.div
                        key={platform.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        className="flex flex-col bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-pink-500/30 transition-all duration-300"
                    >
                        <div className={`h-24 ${platform.color} flex items-center justify-center p-6 bg-opacity-90`}>
                            <img src={platform.logo} alt={platform.name} className="h-full object-contain filter brightness-100" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-xl mb-2">{platform.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 leading-relaxed">
                                {platform.description}
                            </p>

                            <div className="space-y-2 mb-6">
                                {platform.safetyProps.map((prop) => (
                                    <div key={prop} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {prop}
                                    </div>
                                ))}
                            </div>

                            <a
                                href={platform.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-center text-sm hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Book on {platform.name}
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* SOS button */}
            <div className="mt-8 overflow-hidden relative group">
                <div className={`absolute inset-0 transition-colors duration-300 ${sosTriggered ? 'bg-green-500/10' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
                <div className={`relative p-6 border rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 ${sosTriggered ? 'border-green-400' : 'border-red-200 dark:border-red-900/30'}`}>
                    <div className="flex gap-4 items-start">
                        <div className={`p-2.5 rounded-xl shadow-lg ${sosTriggered ? 'bg-green-500 shadow-green-500/40' : 'bg-red-500 shadow-red-500/40'}`}>
                            <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className={`font-bold ${sosTriggered ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {sosTriggered ? '✓ SOS Triggered — Help is on the way' : 'Emergency SOS'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {sosTriggered
                                    ? 'Your location has been shared with your emergency contacts.'
                                    : 'Share live location with emergency contacts instantly'}
                            </p>
                        </div>
                    </div>
                    {!sosTriggered && (
                        <button
                            onClick={handleSOS}
                            disabled={sosLoading}
                            className="w-full sm:w-auto px-10 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black tracking-widest shadow-xl shadow-red-600/30 hover:shadow-red-600/50 transition-all hover:scale-105 active:scale-100 flex items-center gap-2 justify-center"
                        >
                            {sosLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            SOS
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
