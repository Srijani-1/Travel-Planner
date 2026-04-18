git add frontend/src/app/pages/DashboardHome.tsxtypeimport { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Plus, TrendingUp, CheckCircle2, Bookmark } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { useNavigate } from "react-router";

export function DashboardHome() {
    const navigate = useNavigate();

    const stats = [
        { label: "Trips Planned", value: "12", icon: TrendingUp, color: "blue", gradient: "from-blue-500 to-cyan-500" },
        { label: "Trips Completed", value: "8", icon: CheckCircle2, color: "green", gradient: "from-green-500 to-emerald-500" },
        { label: "Saved Places", value: "34", icon: Bookmark, color: "purple", gradient: "from-purple-500 to-pink-500" },
    ];

    const recommendedTrips = [
        {
            id: 1,
            destination: "Bali, Indonesia",
            description: "Based on your love for beaches and culture",
            image: "https://images.unsplash.com/photo-1604741872759-42c077855b3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhJTIwdGVtcGxlfGVufDF8fHx8MTc3MzY5MDMwNHww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "7 days",
            budget: "$1,200 - $1,800",
        },
        {
            id: 2,
            destination: "Paris, France",
            description: "Perfect for art and culture enthusiasts",
            image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MzczNTUwOXww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "5 days",
            budget: "$1,500 - $2,200",
        },
        {
            id: 3,
            destination: "Tokyo, Japan",
            description: "A foodie's paradise with modern vibes",
            image: "https://images.unsplash.com/photo-1648871647634-0c99b483cb63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFuJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MzcwNTYxNHww&ixlib=rb-4.1.0&q=80&w=1080",
            duration: "6 days",
            budget: "$1,800 - $2,500",
        },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold">Hello, Traveler 👋</h1>
                    <p className="text-muted-foreground mt-1">Ready to plan your next adventure?</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Button size="lg" onClick={() => navigate("/dashboard/plan-trip")}>
                        <Plus className="h-5 w-5 mr-2" />
                        Plan New Trip
                    </Button>
                </motion.div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        whileHover={{ scale: 1.02, y: -4 }}
                    >
                        <Card className="relative overflow-hidden">
                            <div className={absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity} />
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold">{stat.value}</p>
                                    </div>
                                    <div className={p-3 rounded-xl bg-gradient-to-br ${stat.gradient}}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recommended Trips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Recommended for You</h2>
                    <p className="text-muted-foreground">Based on your travel history and preferences</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedTrips.map((trip, index) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                        >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                                <div className="relative h-48 overflow-hidden">
                                    <ImageWithFallback
                                        src={trip.image}
                                        alt={trip.destination}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                        {trip.duration}
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle>{trip.destination}</CardTitle>
                                    <CardDescription>{trip.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-muted-foreground">Estimated Budget</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">{trip.budget}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => navigate("/dashboard/plan-trip")}
                                    >
                                        Plan This Trip
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-8"
            >
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Ready for Your Next Adventure?</h3>
                                <p className="opacity-90">
                                    Let our AI create the perfect itinerary tailored just for you
                                </p>
                            </div>
                            <Button
                                size="lg"
                                variant="secondary"
                                onClick={() => navigate("/dashboard/plan-trip")}
                                className="whitespace-nowrap"
                            >
                                Start Planning
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}