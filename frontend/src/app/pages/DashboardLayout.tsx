import { Outlet, useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import {
  LayoutDashboard, MapPin, Briefcase, Bookmark,
  Shield, User, Home, LogOut, Settings as SettingsIcon,
  Map, Car, BedDouble, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: MapPin, label: "Plan Trip", path: "/dashboard/plan-trip" },
    { icon: Briefcase, label: "My Trips", path: "/dashboard/my-trips" },
    { icon: Bookmark, label: "Saved", path: "/dashboard/saved" },
    { icon: Shield, label: "Safety", path: "/dashboard/safety" },
    { icon: Car, label: "Safe Rides", path: "/dashboard/safe-ride" },
    { icon: BedDouble, label: "Safe Stays", path: "/dashboard/safe-stays" },
    { icon: User, label: "Profile", path: "/dashboard/profile" },
    { icon: SettingsIcon, label: "Settings", path: "/dashboard/settings" },
  ];

  // Group items so women-safety items are visually separated
  const mainItems = menuItems.slice(0, 5);
  const womenItems = menuItems.slice(5, 7);
  const bottomItems = menuItems.slice(7);

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const NavButton = ({ item }: { item: typeof menuItems[0] }) => (
    <motion.button
      key={item.path}
      onClick={() => { navigate(item.path); setSidebarOpen(false); }}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive(item.path)
          ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 text-primary border border-primary/20 shadow-sm font-semibold"
          : "text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/5 hover:text-foreground font-medium"
        }`}
    >
      <item.icon className={`h-4 w-4 shrink-0 ${isActive(item.path) ? "text-primary" : ""}`} />
      <span>{item.label}</span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed top-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Map className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-foreground">Travel AI</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-64 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-r border-white/20 dark:border-white/10 z-40 shadow-2xl flex flex-col"
          >
            {/* ── Logo (desktop only) ── */}
            <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-border/40 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Map className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">Travel AI</span>
            </div>

            {/* ── Theme toggle (desktop) ── */}
            <div className="hidden lg:flex px-5 py-3 border-b border-border/40 items-center justify-between shrink-0">
              <span className="text-xs text-muted-foreground font-medium">Theme</span>
              <ThemeToggle />
            </div>

            {/* ── Scrollable nav ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 mt-14 lg:mt-0 space-y-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">

              {/* Main items */}
              {mainItems.map(item => <NavButton key={item.path} item={item} />)}

              {/* Women-safety group */}
              <div className="pt-2 pb-1">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-pink-400 dark:text-pink-500">
                  Women's Safety
                </p>
                {womenItems.map(item => (
                  <motion.button
                    key={item.path}
                    onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive(item.path)
                        ? "bg-gradient-to-r from-pink-500/15 to-rose-500/15 text-pink-600 dark:text-pink-400 border border-pink-400/20 shadow-sm font-semibold"
                        : "text-muted-foreground hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:text-pink-600 dark:hover:text-pink-400 font-medium"
                      }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${isActive(item.path) ? "text-pink-500" : ""}`} />
                    <span>{item.label}</span>
                    {/* Pink dot indicator */}
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pink-400 shrink-0" />
                  </motion.button>
                ))}
              </div>

              {/* Profile + Settings */}
              <div className="pt-1">
                {bottomItems.map(item => <NavButton key={item.path} item={item} />)}
              </div>
            </nav>

            {/* ── Logout — always visible at bottom ── */}
            <div className="px-3 py-3 border-t border-border/40 shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl text-sm h-10"
                onClick={() => {
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("user");
                  navigate("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}`  `