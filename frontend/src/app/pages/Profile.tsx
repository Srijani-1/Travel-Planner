import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  User, Mail, Phone, TrendingUp, Save, X,
  Pencil, Trash2, MapPin, Calendar, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

// ── API helpers ───────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...options, headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
}

interface TripSummary {
  id: number;
  destination_name: string;
  start_date: string;
  end_date: string;
  travel_style: string | null;
  preferences: string[];
  budget: number | null;
}

// ── Derived insight helpers ───────────────────────────────────────────────────
function getInsights(trips: TripSummary[]) {
  if (!trips.length) return null;

  const allPrefs = trips.flatMap(t => t.preferences ?? []);
  const prefCount: Record<string, number> = {};
  allPrefs.forEach(p => { prefCount[p] = (prefCount[p] ?? 0) + 1; });
  const topPref = Object.entries(prefCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const durations = trips.map(t => {
    const days = Math.round(
      (new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / 86_400_000
    );
    return days;
  });
  const avgDays = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);

  const budgets = trips.map(t => t.budget ?? 0).filter(Boolean);
  const avgBudget = budgets.length
    ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length)
    : null;

  return { topPref, avgDays, avgBudget, totalTrips: trips.length, prefCount };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<Partial<ProfileData>>({});
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load profile + trips on mount
  useEffect(() => {
    Promise.all([
      apiFetch("/users/profile"),
      apiFetch("/trips/"),
    ])
      .then(([p, t]) => { setProfile(p); setTrips(t); })
      .catch(e => toast.error(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const startEdit = () => {
    setDraft({ full_name: profile?.full_name, email: profile?.email, phone: profile?.phone ?? "" });
    setIsEditing(true);
  };

  const cancelEdit = () => { setIsEditing(false); setDraft({}); };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await apiFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify(draft),
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await apiFetch("/users/profile", { method: "DELETE" });
      localStorage.removeItem("access_token");
      window.location.href = "/";
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("") ?? "?";
  const insights = getInsights(trips);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-1">Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your account and travel preferences</p>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="trips">Trip History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-white/40 dark:border-white/10 shadow ring-1 ring-black/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={startEdit} className="gap-2 rounded-xl">
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Avatar row */}
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">Travel Enthusiast · {trips.length} trips</p>
                </div>
              </div>

              {/* Fields */}
              <div className="grid gap-4">
                {[
                  { id: "full_name", label: "Full Name", icon: User, type: "text", key: "full_name" as keyof ProfileData },
                  { id: "email", label: "Email", icon: Mail, type: "email", key: "email" as keyof ProfileData },
                  { id: "phone", label: "Phone Number", icon: Phone, type: "tel", key: "phone" as keyof ProfileData },
                ].map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <div className="relative">
                      <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={field.id}
                        type={field.type}
                        className="pl-10 rounded-xl"
                        disabled={!isEditing}
                        value={isEditing
                          ? (draft[field.key] ?? "") as string
                          : (profile?.[field.key] ?? "") as string
                        }
                        onChange={e => setDraft(d => ({ ...d, [field.key]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Save / Cancel */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="flex gap-3 pt-2"
                  >
                    <Button onClick={saveProfile} disabled={isSaving} className="gap-2 rounded-xl">
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} className="gap-2 rounded-xl">
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {!showDeleteConfirm ? (
                  <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      variant="destructive"
                      className="gap-2 rounded-xl"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-medium text-destructive">
                      This cannot be undone. All your trips, itineraries and saved places will be permanently deleted.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="destructive" className="rounded-xl gap-2" onClick={deleteAccount}>
                        <Trash2 className="h-4 w-4" /> Yes, delete everything
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Trip History Tab ── */}
        <TabsContent value="trips" className="mt-6">
          <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-white/40 dark:border-white/10 shadow ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Trip History</CardTitle>
              <CardDescription>All your planned and completed adventures</CardDescription>
            </CardHeader>
            <CardContent>
              {trips.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No trips yet</p>
                  <p className="text-sm mt-1">Start planning your first adventure!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center text-lg">
                          ✈️
                        </div>
                        <div>
                          <p className="font-semibold">{trip.destination_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.start_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                            {" — "}
                            {new Date(trip.end_date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {trip.preferences?.slice(0, 2).map(p => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                        {trip.budget && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            ${trip.budget.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Insights Tab ── */}
        <TabsContent value="insights" className="mt-6 space-y-6">
          {!insights ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No data yet</p>
                <p className="text-sm mt-1">Plan a few trips and insights will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Trips", value: insights.totalTrips, suffix: "" },
                  { label: "Avg Duration", value: `${insights.avgDays} days`, suffix: "" },
                  { label: "Avg Budget", value: insights.avgBudget ? `$${insights.avgBudget.toLocaleString()}` : "—", suffix: "" },
                  { label: "Top Interest", value: insights.topPref, suffix: "" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur border-white/40 dark:border-white/10 ring-1 ring-black/5">
                      <CardContent className="pt-5 pb-4">
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Interest breakdown */}
              <Card className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur border-white/40 dark:border-white/10 ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" /> Interest Breakdown
                  </CardTitle>
                  <CardDescription>How often each interest appears across your trips</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(insights.prefCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([pref, count], i) => {
                      const pct = Math.round((count / insights.totalTrips) * 100);
                      return (
                        <motion.div
                          key={pref}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="space-y-1.5"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{pref}</span>
                            <span className="text-muted-foreground">{count} trip{count > 1 ? "s" : ""} · {pct}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, delay: 0.2 + i * 0.07 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </CardContent>
              </Card>

              {/* AI recommendation */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    ✨ AI Recommendation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {insights.topPref === "Beach" || insights.topPref === "Relaxation"
                      ? "You love unwinding — consider the Maldives or Phuket for your next escape."
                      : insights.topPref === "Food"
                        ? "You're a foodie! Bologna or Osaka would be perfect next destinations."
                        : insights.topPref === "Culture" || insights.topPref === "Adventure"
                          ? "Based on your interests, you'd love exploring Peru or Morocco next."
                          : `Based on your love of ${insights.topPref}, we suggest exploring Southeast Asia or the Mediterranean.`
                    }
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}