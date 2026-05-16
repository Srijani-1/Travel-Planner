import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Sparkles } from "lucide-react";

const STAGES = [
    { pct: 8, msg: "Validating your destination…", icon: "🗺️" },
    { pct: 18, msg: "Studying local geography & climate…", icon: "🌤️" },
    { pct: 30, msg: "Curating day-by-day activities…", icon: "📅" },
    { pct: 42, msg: "Finding hotels within your budget…", icon: "🏨" },
    { pct: 54, msg: "Picking the best dining spots…", icon: "🍽️" },
    { pct: 64, msg: "Checking local events & festivals…", icon: "🎉" },
    { pct: 73, msg: "Building your safety guide…", icon: "🛡️" },
    { pct: 82, msg: "Calculating cost breakdown…", icon: "💰" },
    { pct: 90, msg: "Assembling your smart packing list…", icon: "🎒" },
    { pct: 96, msg: "Polishing the final itinerary…", icon: "✨" },
    { pct: 99, msg: "Almost ready — just a moment…", icon: "🚀" },
];

export function TripGeneratingLoader({ destination }: { destination: string }) {
    const [progress, setProgress] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        // Each stage lasts ~3 seconds; total fake journey ≈ 33 s
        let currentStage = 0;

        const tick = setInterval(() => {
            currentStage = Math.min(currentStage + 1, STAGES.length - 1);
            setStageIndex(currentStage);

            // Animate progress smoothly to the next stage percentage
            const target = STAGES[currentStage].pct;
            setProgress(target);

            if (currentStage === STAGES.length - 1) clearInterval(tick);
        }, 3000);

        // Also run a fine-grained sub-tick so the bar moves smoothly
        const smoothTick = setInterval(() => {
            setProgress(prev => {
                const nextTarget = STAGES[Math.min(currentStage, STAGES.length - 1)].pct;
                if (prev < nextTarget) return Math.min(prev + 0.4, nextTarget);
                return prev;
            });
        }, 80);

        return () => { clearInterval(tick); clearInterval(smoothTick); };
    }, []);

    const stage = STAGES[stageIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-600/20 to-indigo-600/20 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-lg px-6 text-center space-y-10">

                {/* Destination */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-slate-600 dark:text-slate-400 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-pink-500 dark:text-pink-400" />
                        Generating your trip
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight break-words">
                        {destination}
                    </h1>
                </motion.div>

                {/* Animated icon */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stageIndex}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.35 }}
                        className="text-6xl"
                    >
                        {stage.icon}
                    </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="space-y-3">
                    <div className="relative h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500"
                            style={{ width: `${progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.3 }}
                        />
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span>Crafting itinerary…</span>
                        <span className="font-black text-slate-700 dark:text-slate-300">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Stage message */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={stageIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="text-slate-600 dark:text-slate-400 text-sm font-medium tracking-wide"
                    >
                        {stage.msg}
                    </motion.p>
                </AnimatePresence>

                {/* Stage dots */}
                <div className="flex justify-center gap-1.5">
                    {STAGES.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i < stageIndex
                                ? "w-4 bg-pink-500"
                                : i === stageIndex
                                    ? "w-6 bg-indigo-500 dark:bg-indigo-400"
                                    : "w-1.5 bg-slate-200 dark:bg-white/10"
                                }`}
                        />
                    ))}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-600">
                    This usually takes 20–40 seconds. Hang tight!
                </p>
            </div>
        </div>
    );
}
