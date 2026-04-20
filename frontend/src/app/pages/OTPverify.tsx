import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Map, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function OTPVerify() {
    const navigate = useNavigate();
    const location = useLocation();

    // user_id passed via navigate state: navigate("/verify-otp", { state: { userId, email } })
    const { userId, email } = (location.state ?? {}) as { userId: number; email: string };

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    // Redirect if landed without userId
    useEffect(() => {
        if (!userId) navigate("/register");
    }, [userId]);

    // Cooldown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleChange = (i: number, val: string) => {
        if (!/^\d?$/.test(val)) return;   // digits only
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        setError("");
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (text.length === 6) {
            setOtp(text.split(""));
            inputs.current[5]?.focus();
        }
        e.preventDefault();
    };

    const handleVerify = async () => {
        const code = otp.join("");
        if (code.length < 6) { setError("Please enter all 6 digits"); return; }

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`${API}/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, otp: code }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.detail ?? "Verification failed");
                setOtp(["", "", "", "", "", ""]);
                inputs.current[0]?.focus();
                return;
            }

            setSuccess(true);
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setTimeout(() => navigate("/dashboard"), 1200);
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendCooldown(60);
        setError("");
        try {
            await fetch(`${API}/resend-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });
        } catch {
            setError("Failed to resend. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f12] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#13161a] px-8 py-10">

                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Map className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-slate-900 dark:text-white font-semibold text-lg">Travel AI</span>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Email verified!</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Taking you to your dashboard…</p>
                            </motion.div>
                        ) : (
                            <motion.div key="form">
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
                                    Check your email
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                                    We sent a 6-digit code to
                                </p>
                                <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm mb-8 break-all">
                                    {email}
                                </p>

                                {/* OTP boxes */}
                                <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                                    {otp.map((digit, i) => (
                                        <motion.input
                                            key={i}
                                            ref={el => { inputs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleChange(i, e.target.value)}
                                            onKeyDown={e => handleKeyDown(i, e)}
                                            animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                                            transition={{ duration: 0.3 }}
                                            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-150
                        bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white
                        ${digit ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 dark:border-white/10"}
                        ${error ? "border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20" : ""}
                        focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-white/10`}
                                        />
                                    ))}
                                </div>

                                {/* Error */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-1.5 text-sm text-red-500 dark:text-red-400 mb-4"
                                        >
                                            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                                        </motion.p>
                                    )}
                                </AnimatePresence>

                                {/* Verify button */}
                                <button
                                    onClick={handleVerify}
                                    disabled={isLoading || otp.join("").length < 6}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Verifying…
                                        </span>
                                    ) : "Verify Email"}
                                </button>

                                {/* Resend */}
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
                                    Didn't receive it?{" "}
                                    {resendCooldown > 0 ? (
                                        <span className="text-slate-400 dark:text-slate-600">
                                            Resend in {resendCooldown}s
                                        </span>
                                    ) : (
                                        <button
                                            onClick={handleResend}
                                            className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 transition-colors"
                                        >
                                            Resend code
                                        </button>
                                    )}
                                </p>

                                <button
                                    onClick={() => navigate("/register")}
                                    className="mt-4 w-full text-center text-xs text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
                                >
                                    ← Use a different email
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}