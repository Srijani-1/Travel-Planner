import { useState } from "react";
import { useNavigate } from "react-router";
import { Map, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
        <label className="block mb-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          className={`peer relative z-10 border h-11 w-full rounded-lg bg-slate-50 dark:bg-white/5 px-4 text-slate-900 dark:text-white font-light outline-none transition-all duration-200 focus:bg-white dark:focus:bg-white/10 placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-normal text-sm shadow-sm dark:shadow-none
            ${error
              ? "border-red-400 dark:border-red-600 focus:border-red-500"
              : "border-slate-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-white/20"
            }`}
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && !error && (
          <>
            <div className="absolute pointer-events-none top-0 left-0 right-0 h-[1px] z-20 rounded-t-lg overflow-hidden"
              style={{ background: `radial-gradient(40px circle at ${mousePosition.x}px 0px, #a78bfa 0%, transparent 70%)` }} />
            <div className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1px] z-20 rounded-b-lg overflow-hidden"
              style={{ background: `radial-gradient(40px circle at ${mousePosition.x}px 2px, #a78bfa 0%, transparent 70%)` }} />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-slate-500 dark:text-slate-400">{icon}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500 dark:text-red-400">
            <AlertCircle className="h-3 w-3 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const ErrorBanner = ({ message }: { message: string }) => (
  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
    className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
    <span>{message}</span>
  </motion.div>
);

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setFieldErrors(f => ({ ...f, [name]: "" }));
    setGlobalError("");
  };

  const validate = () => {
    const errors = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Enter a valid email address";
    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords don't match";
    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.detail ?? "Registration failed.";
        // Route backend errors to the right field
        if (detail.toLowerCase().includes("email")) {
          setFieldErrors(f => ({ ...f, email: detail }));
        } else if (detail.toLowerCase().includes("phone")) {
          setFieldErrors(f => ({ ...f, phone: detail }));
        } else {
          setGlobalError(detail);
        }
        return;
      }

      navigate("/verify-otp", {
        state: {
          userId: data.user_id,
          email: formData.email,
        },
      });
    } catch {
      setGlobalError("Unable to connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0f12] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        className="w-full max-w-4xl relative z-10">

        <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 bg-white dark:bg-[#13161a] transition-colors duration-300">

          {/* ── Photo panel ── */}
          <div className="hidden lg:block w-1/2 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&auto=format&fit=crop&q=80"
              alt="Travel" className="w-full h-full object-cover opacity-80 dark:opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-l from-white via-transparent to-transparent dark:from-[#13161a]" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-[#13161a]/80" />
            <div className="absolute bottom-10 left-8 right-8">
              <p className="text-slate-900 dark:text-white text-2xl font-bold leading-snug drop-shadow-lg">
                Join thousands of<br />modern travelers 🌍
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-sm mt-2">Let AI plan your perfect trip in seconds.</p>
              <div className="flex gap-6 mt-6">
                {[["1,247+", "Trips Planned"], ["98%", "Happy Travelers"], ["50+", "Countries"]].map(([num, label]) => (
                  <div key={label}>
                    <div className="text-slate-900 dark:text-white font-bold text-lg">{num}</div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Form panel ── */}
          <div className="w-full lg:w-1/2 px-8 lg:px-12 py-10 relative overflow-hidden flex flex-col justify-center"
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMousePosition({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-full blur-3xl transition-opacity duration-300 ${isHovering ? "opacity-100" : "opacity-0"}`}
              style={{ transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`, transition: "transform 0.1s ease-out, opacity 0.3s" }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Map className="h-5 w-5 text-white" />
                </div>
                <span className="text-slate-900 dark:text-white font-semibold text-lg">Travel AI</span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Create your account</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">Start planning amazing trips today</p>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <AnimatePresence>
                  {globalError && <ErrorBanner message={globalError} />}
                </AnimatePresence>

                <AppInput label="Full Name" name="fullName" type="text" placeholder="Jane Smith"
                  value={formData.fullName} onChange={handleChange} error={fieldErrors.fullName} />

                <div className="grid grid-cols-2 gap-3">
                  <AppInput label="Email" name="email" type="email" placeholder="you@email.com"
                    value={formData.email} onChange={handleChange} error={fieldErrors.email} />
                  <AppInput label="Phone" name="phone" type="tel" placeholder="+1 555 0000"
                    value={formData.phone} onChange={handleChange} error={fieldErrors.phone} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <AppInput label="Password" name="password" type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters" value={formData.password} onChange={handleChange}
                    error={fieldErrors.password}
                    icon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="pointer-events-auto">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>} />
                  <AppInput label="Confirm" name="confirmPassword" type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange}
                    error={fieldErrors.confirmPassword}
                    icon={<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pointer-events-auto">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>} />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" required
                    className="mt-0.5 rounded border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 accent-purple-500 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">Terms of Service</a>
                    {" "}and{" "}
                    <a href="#" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 transition-colors">Privacy Policy</a>
                  </span>
                </label>

                <button type="submit" disabled={isLoading}
                  className="group/btn relative w-full h-11 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm overflow-hidden hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <>
                      Create Account
                      <div className="absolute inset-0 flex justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/btn:duration-700 group-hover/btn:[transform:skew(-13deg)_translateX(100%)]">
                        <div className="relative h-full w-10 bg-white/20" />
                      </div>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-600 dark:text-slate-500 text-sm mt-5">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold transition-colors">
                  Log in
                </button>
              </p>
              <button type="button" onClick={() => navigate("/")}
                className="mt-3 w-full text-center text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 text-xs transition-colors">
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}