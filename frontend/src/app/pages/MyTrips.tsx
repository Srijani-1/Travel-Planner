import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar, MapPin, DollarSign, Eye, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { toast } from "sonner";
import { useDestinationImage } from "../../hooks/useDestinationImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

interface Trip {
  id: number;
  destination_name: string;
  start_date: string;
  end_date: string;
  status?: string;
  budget?: number;
  travel_style?: string;
  days_left?: number;
}

const TripCard = ({ trip, isPast, onView, onUpdateStatus, onCancel }: { 
    trip: Trip; 
    isPast: boolean;
    onView: (id: number) => void;
    onUpdateStatus: (id: number, status: string) => void;
    onCancel: (id: number) => void;
}) => {
  const { src, loading } = useDestinationImage(
    trip.destination_name,
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800"
  );
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="overflow-hidden hover:shadow-lg transition-all border-slate-200 dark:border-white/10 group bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
      <div className="grid md:grid-cols-3 gap-0">
        <div className="relative h-48 md:h-auto overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-zinc-800 animate-pulse z-10" />
          )}
          <ImageWithFallback
            src={src}
            alt={trip.destination_name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className="shadow-lg font-bold" variant={isPast ? "secondary" : "default"}>
              {isPast ? "COMPLETED" : trip.status === "next" ? "★ NEXT TRIP" : "PLANNED"}
            </Badge>
          </div>
        </div>

        <div className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 mb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
                  {trip.destination_name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <span>
                    {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-bold tracking-tight">₹{trip.budget?.toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="default"
              onClick={() => onView(trip.id)}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 font-bold"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Plan
            </Button>

            {!isPast && (
              <>
                {trip.status !== "next" && (
                  <Button
                    variant="outline"
                    onClick={() => onUpdateStatus(trip.id, "next")}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:text-blue-400"
                  >
                    Set as Next
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatus(trip.id, "completed")}
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:text-emerald-400"
                >
                  Mark Visited
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 ml-auto">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-slate-200 dark:border-white/10 shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Delete trip?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your itinerary for <strong>{trip.destination_name}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold">Back</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCancel(trip.id)}
                        className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  </motion.div>
  );
};

export function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<{ upcoming: Trip[]; past: Trip[] }>({
    upcoming: [],
    past: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/trips/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        toast.error("Session expired. Please login again.");
        navigate("/");
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch trips");
      const data: Trip[] = await res.json();

      const upcoming = data.filter(t => t.status !== "completed");
      const past = data.filter(t => t.status === "completed");

      setStrips({ upcoming, past });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [navigate]);

  const setStrips = (val: any) => setTrips(val);

  const handleUpdateStatus = async (tripId: number, status: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/trips/${tripId}/status?status=${status}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Trip marked as ${status}`);
      fetchTrips(); // Refresh
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (tripId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete trip");

      toast.success("Trip cancelled successfully");
      fetchTrips(); // Refresh
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        <p className="font-medium text-slate-500">Loading your itineraries...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">My Trips</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your generated travel itineraries and upcoming adventures</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
          <TabsTrigger value="upcoming" className="rounded-xl font-bold">Upcoming ({trips.upcoming.length})</TabsTrigger>
          <TabsTrigger value="past" className="rounded-xl font-bold">Past ({trips.past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-8 space-y-6 outline-none">
          {trips.upcoming.length > 0 ? (
            trips.upcoming.map((trip) => (
                <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    isPast={false} 
                    onView={(id) => navigate(`/dashboard/itinerary/${id}`)}
                    onUpdateStatus={handleUpdateStatus}
                    onCancel={handleCancel}
                />
            ))
          ) : (
            <Card className="border-dashed py-20 text-center bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/10 rounded-3xl">
              <CardContent className="space-y-4">
                <div className="h-20 w-20 bg-white dark:bg-white/5 mx-auto rounded-3xl flex items-center justify-center shadow-sm">
                  <MapPin className="h-10 w-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">No upcoming trips</h3>
                  <p className="text-slate-500 dark:text-slate-400">Start planning your next adventure today!</p>
                </div>
                <Button
                  onClick={() => navigate("/dashboard/plan-trip")}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-black px-8 py-6 rounded-2xl shadow-xl transition-all hover:scale-105"
                >
                  Plan a New Trip
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-8 space-y-6 outline-none">
          {trips.past.length > 0 ? (
            trips.past.map((trip) => (
                <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    isPast={true} 
                    onView={(id) => navigate(`/dashboard/itinerary/${id}`)}
                    onUpdateStatus={handleUpdateStatus}
                    onCancel={handleCancel}
                />
            ))
          ) : (
            <Card className="border-dashed py-20 text-center bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/10 rounded-3xl">
              <CardContent>
                <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight mb-2">No travel history</h3>
                <p className="text-slate-500 dark:text-slate-400">Your completed trips will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}