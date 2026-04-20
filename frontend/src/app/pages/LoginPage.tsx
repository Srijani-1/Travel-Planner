import { useState } from "react";
import { useNavigate } from "react-router";
import { Map, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";
import { useGoogleLogin } from "@react-oauth/google";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Fancy Input ───────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
    error?: string;
}

const AppInput = ({ label, icon, error, ...rest }: InputProps) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className="w-full relative">
            {label && (
                <label className="block mb-2 text-sm text-slate-600 dark:text-slate-400">{label}</label>
            )}
            <div className="relative w-full">
                <input
                    className={`peer relative z-10 border h-12 w-full rounded-lg bg-slate-50 dark:bg-white/5 px-4 text-slate-900 dark:text-white font-light outline-none transition-all duration-200 focus:bg-white dark:focus:bg-white/10 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal shadow-sm dark:shadow-none
            ${error
                            ? "border-red-400 dark:border-red-500 focus:border-red-500"
                            : "border-slate-200 dark:border-white/10 focus:border-blue-500 dark:focus:border-white/20"
                        }`}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    {...rest}
                />
                {isHovering && !error && (
                    <>
                        <div
                            className="absolute pointer-events-none top-0 left-0 right-0 h-[1px] z-20 rounded-t-lg overflow-hidden"
                            style={{ background: `radial-gradient(40px circle at ${mousePosition.x}px 0px, #60a5fa 0%, transparent 70%)` }}
                        />
                        <div
                            className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1px] z-20 rounded-b-lg overflow-hidden"
                            style={{ background: `radial-gradient(40px circle at ${mousePosition.x}px 2px, #60a5fa 0%, transparent 70%)` }}
                        />
                    </>
                )}
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-slate-500 dark:text-slate-400">
                        {icon}
                    </div>
                )}
            </div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500 dark:text-red-400"
                    >
                        <AlertCircle className="h-3 w-3 shrink-0" /> {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Error banner ──────────────────────────────────────────────────────────────
const ErrorBanner = ({ message }: { message: string }) => (
    <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
    >
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>{message}</span>
    </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export function LoginPage() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({ identifier: "", password: "" });
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // ── Google login hook — MUST be inside the component function ──
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true);
            setGlobalError("");
            try {
                const res = await fetch(`${API}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: tokenResponse.access_token }),
                });
                const data = await res.json();
                if (!res.ok) {
                    setGlobalError(data.detail ?? "Google login failed");
                    return;
                }
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/dashboard");
            } catch {
                setGlobalError("Google login failed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => setGlobalError("Google sign-in was cancelled or failed"),
    });

    // ── Email/password login ──
    const validate = () => {
        const errors = { identifier: "", password: "" };
        if (!identifier.trim()) errors.identifier = "Please enter your email or phone number";
        if (!password) errors.password = "Please enter your password";
        setFieldErrors(errors);
        return !errors.identifier && !errors.password;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError("");
        if (!validate()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                const detail = data.detail ?? "Login failed. Please try again.";
                if (detail.toLowerCase().includes("verify your email")) {
                    setGlobalError("Please verify your email first. Check your inbox for the 6-digit code.");
                } else if (detail.toLowerCase().includes("no account")) {
                    setFieldErrors(f => ({ ...f, identifier: "No account found with that email or phone number" }));
                } else if (detail.toLowerCase().includes("incorrect password") || detail.toLowerCase().includes("invalid password")) {
                    setFieldErrors(f => ({ ...f, password: "Incorrect password" }));
                } else {
                    setGlobalError(detail);
                }
                return;
            }

            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/dashboard");
        } catch {
            setGlobalError("Unable to connect to the server. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f12] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                className="w-full max-w-4xl relative z-10"
            >
                <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 bg-white dark:bg-[#13161a] transition-colors duration-300">

                    {/* ── Form panel ── */}
                    <div
                        className="w-full lg:w-1/2 px-8 lg:px-14 py-12 relative overflow-hidden flex flex-col justify-center"
                        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <div
                            className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}
                            style={{ transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`, transition: "transform 0.1s ease-out, opacity 0.3s" }}
                        />

                        <div className="relative z-10">
                            {/* Logo */}
                            <div className="flex items-center gap-2 mb-10">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Map className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-slate-900 dark:text-white font-semibold text-lg">Travel AI</span>
                            </div>

                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Welcome back</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Log in to continue your journey</p>

                            {/* ── Google button — in JSX, inside return ── */}
                            <button
                                type="button"
                                onClick={() => googleLogin()}
                                disabled={isLoading}
                                className="w-full h-11 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center gap-3 transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
                                    <path fill="#EA4335" d="M5.27 9.76A7.08 7.08 0 0 1 19 10.9h-7v2.73h9.9a10 10 0 1 1-2.96-9.18z" />
                                    <path fill="#4285F4" d="M5.27 9.76A7.08 7.08 0 0 1 19 10.9h-7v2.73h9.9C20.08 19.1 16.46 22 12 22A10 10 0 0 1 5.27 9.76z" />
                                    <path fill="#34A853" d="M12 22c4.46 0 8.08-2.9 9.9-8.37H12v-2.73h7A7.08 7.08 0 1 1 5.27 9.76L2.46 7.63A10 10 0 0 0 12 22z" />
                                    <path fill="#FBBC05" d="M2.46 7.63A10 10 0 0 1 12 2c2.7 0 5.15 1.02 7 2.68L16.14 7.5A7.08 7.08 0 0 0 5.27 9.76z" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center gap-3 mb-6">
                                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                                <span className="text-slate-400 dark:text-slate-500 text-xs">or use your email</span>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                            </div>

                            {/* Email/password form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <AnimatePresence>
                                    {globalError && <ErrorBanner message={globalError} />}
                                </AnimatePresence>

                                <AppInput
                                    placeholder="Email or phone number"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => { setIdentifier(e.target.value); setFieldErrors(f => ({ ...f, identifier: "" })); setGlobalError(""); }}
                                    error={fieldErrors.identifier}
                                />

                                <AppInput
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(f => ({ ...f, password: "" })); setGlobalError(""); }}
                                    error={fieldErrors.password}
                                    icon={
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="pointer-events-auto">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    }
                                />

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                        <input type="checkbox" className="rounded border-slate-300 dark:border-white/20 accent-blue-500" />
                                        Remember me
                                    </label>
                                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                        Forgot password?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group/btn relative w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Logging in…
                                        </span>
                                    ) : (
                                        <>
                                            Log in
                                            <div className="absolute inset-0 flex justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/btn:duration-700 group-hover/btn:[transform:skew(-13deg)_translateX(100%)]">
                                                <div className="relative h-full w-10 bg-white/20" />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-slate-600 dark:text-slate-500 text-sm mt-6">
                                Don't have an account?{" "}
                                <button type="button" onClick={() => navigate("/register")}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors">
                                    Sign up
                                </button>
                            </p>
                            <button type="button" onClick={() => navigate("/")}
                                className="mt-4 w-full text-center text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 text-xs transition-colors">
                                ← Back to Home
                            </button>
                        </div>
                    </div>

                    {/* ── Photo panel ── */}
                    <div className="hidden lg:block w-1/2 relative overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=900&auto=format&fit=crop&q=80"
                            alt="Travel destination"
                            className="w-full h-full object-cover opacity-80 dark:opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent dark:from-[#13161a]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-[#13161a]/80" />
                        <div className="absolute bottom-10 left-8 right-8">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-snug drop-shadow-lg">
                                Your next adventure<br />starts here ✈️
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mt-2">
                                AI-powered itineraries tailored to you.
                            </p>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}