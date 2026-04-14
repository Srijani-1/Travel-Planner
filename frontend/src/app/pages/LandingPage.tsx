import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Map, Utensils, Wallet, Shield, Sparkles, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ThemeToggle } from "../components/ThemeToggle";

export function LandingPage() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Sparkles,
            title: "AI Itinerary Generator",
            description: "Smart travel plans crafted by AI based on your unique preferences and interests.",
        },
        {
            icon: Utensils,
            title: "Local Food Discovery",
            description: "Find authentic local cuisines and hidden culinary gems at your destination.",
        },
        {
            icon: Wallet,
            title: "Smart Budgeting",
            description: "Plan your trip within your budget with intelligent cost optimization.",
        },
        {
            icon: Shield,
            title: "Women Safety Mode",
            description: "Enhanced safety features including safe zones, emergency contacts, and verified routes.",
        },
    ];

    const demoTrips = [
        {
            destination: "Bali, Indonesia",
            duration: "7 Days",
            image: "https://images.unsplash.com/photo-1604741872759-42c077855b3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxpJTIwaW5kb25lc2lhJTIwdGVtcGxlfGVufDF8fHx8MTc3MzY5MDMwNHww&ixlib=rb-4.1.0&q=80&w=1080",
            type: "Culture & Relaxation",
        },
        {
            destination: "Paris, France",
            duration: "5 Days",
            image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MzczNTUwOXww&ixlib=rb-4.1.0&q=80&w=1080",
            type: "Romance & Culture",
        },
        {
            destination: "Tokyo, Japan",
            duration: "6 Days",
            image: "https://images.unsplash.com/photo-1648871647634-0c99b483cb63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMGphcGFuJTIwY2l0eXNjYXBlfGVufDF8fHx8MTc3MzcwNTYxNHww&ixlib=rb-4.1.0&q=80&w=1080",
            type: "Food & Adventure",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 dark:to-primary/10">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-card/80 dark:bg-card/90 backdrop-blur-lg border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Map className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold">Travel AI</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <Button variant="ghost" onClick={() => navigate("/login")}>
                                Login
                            </Button>
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" onClick={() => navigate("/register")}>
                                Register
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Plan Your Perfect Trip with AI
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Smart itineraries based on your preferences, budget & safety. Let AI handle the
                                planning while you dream about the journey.
                            </p>
                            <div className="flex gap-4">
                                <Button size="lg" onClick={() => navigate("/register")} className="text-lg px-8">
                                    Start Planning
                                </Button>
                                <Button size="lg" variant="outline" className="text-lg px-8">
                                    Watch Demo
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="rounded-2xl overflow-hidden shadow-2xl">
                                <ImageWithFallback
                                    src="https://images.unsplash.com/photo-1714412192114-61dca8f15f68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcGFyYWRpc2UlMjB2YWNhdGlvbnxlbnwxfHx8fDE3NzM3MTY0OTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                    alt="Tropical beach destination"
                                    className="w-full h-[500px] object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-xl p-4 flex items-center gap-3">
                                <Calendar className="h-8 w-8 text-blue-600" />
                                <div>
                                    <div className="font-semibold">1,247+</div>
                                    <div className="text-sm text-gray-600">Trips Planned</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Why Choose Travel AI?</h2>
                        <p className="text-xl text-gray-600">Intelligent features that make trip planning effortless</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                            <feature.icon className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <CardTitle>{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base">{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Preview Section */}
            <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Popular Destinations</h2>
                        <p className="text-xl text-gray-600">Explore sample itineraries created by our AI</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {demoTrips.map((trip, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                                    <div className="relative h-56 overflow-hidden">
                                        <ImageWithFallback
                                            src={trip.image}
                                            alt={trip.destination}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                                            {trip.duration}
                                        </div>
                                    </div>
                                    <CardHeader>
                                        <CardTitle>{trip.destination}</CardTitle>
                                        <CardDescription>{trip.type}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button variant="outline" className="w-full">View Itinerary</Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold mb-6">Ready to Start Your Adventure?</h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of travelers who trust AI to plan their perfect trips
                    </p>
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => navigate("/register")}
                        className="text-lg px-8"
                    >
                        Get Started Free
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Map className="h-6 w-6" />
                                <span className="font-semibold">Travel AI</span>
                            </div>
                            <p className="text-gray-400">
                                Your AI-powered travel companion for unforgettable journeys.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Features</a></li>
                                <li><a href="#" className="hover:text-white">Pricing</a></li>
                                <li><a href="#" className="hover:text-white">Demo</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">About</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Terms</a></li>
                                <li><a href="#" className="hover:text-white">Privacy</a></li>
                                <li><a href="#" className="hover:text-white">Security</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2026 Travel AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
