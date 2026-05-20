import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Map, Utensils, Wallet, Shield, Sparkles, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/ImageWithFallback";
import { ThemeToggle } from "../components/ThemeToggle";
import ScrollExpandMedia from "../components/ui/scroll-expansion-hero";

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
      {/* Sticky Navbar — sits above the scroll-expand hero */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-card/90 backdrop-blur-lg border-b">
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Map className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold">Travel AI</span>
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-8 items-center">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md transition-all hover:scale-105"
                onClick={() => navigate("/login")}
              >
                Login / Register
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Scroll-Expand Hero ──────────────────────────────────────────── */}
      {/*
        The hero uses a scenic travel image as the background.
        The expanding "card" shows another dramatic travel photo.
        Title splits apart as the card grows: "Plan" flies left, "Your Perfect Trip" flies right.
        Scroll hint nudges the user to interact.
        All the page content below is revealed once the card is fully expanded.
      */}
      <ScrollExpandMedia
        mediaType="image"
        mediaSrc="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1280&auto=format&fit=crop&q=80"
        bgImageSrc="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&auto=format&fit=crop&q=80"
        title="Plan Your Perfect Trip"
        date="✈ AI-Powered Travel"
        scrollToExpand="Scroll to explore ↓"
      //textBlend
      >
        {/* ── Everything below here is the rest of the landing page ── */}

        {/* CTA Strip — shown right after hero expands */}
        <section className="relative overflow-hidden bg-white dark:bg-zinc-950 py-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm mb-6 border border-blue-200 dark:border-blue-800/50 backdrop-blur-md">
                  <Sparkles className="w-4 h-4" />
                  <span>The Future of Travel Planning</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight text-foreground">
                  Plan Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 drop-shadow-sm pr-4">
                    Perfect Trip
                  </span>{" "}
                  with AI
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  Smart itineraries based on your preferences, budget & safety. Let AI handle the
                  planning while you dream about the journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate("/register")}
                    className="text-lg px-8 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-blue-500/25 border-0"
                  >
                    Start Planning
                  </Button>

                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-3xl transform rotate-3 scale-105 dark:opacity-50" />
                <div className="rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/20 dark:border-white/10 ring-1 ring-black/5">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1714412192114-61dca8f15f68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwcGFyYWRpc2UlMjB2YWNhdGlvbnxlbnwxfHx8fDE3NzM3MTY0OTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Tropical beach destination"
                    className="w-full h-[500px] object-cover"
                  />
                </div>
                {/* <motion.div
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -bottom-8 -right-8 bg-white/90 dark:bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 p-5 flex items-center gap-4 z-20 border border-white/20 dark:border-white/10"
                >
                  <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-2xl text-foreground">1,247+</div>
                    <div className="text-sm text-muted-foreground font-medium">Trips Planned</div>
                  </div>
                </motion.div> */}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-foreground tracking-tight">
                Why Choose Travel AI?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Intelligent features that make trip planning effortless, personalized, and secure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <Card className="h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/40 dark:border-white/5 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-2">
                    <CardHeader>
                      <div className="h-14 w-14 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/60 dark:border-white/10">
                        <feature.icon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Preview Section */}
        <section className="py-32 relative overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight text-foreground">
                Trending Destinations
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Explore meticulously crafted sample itineraries generated by our sophisticated AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {demoTrips.map((trip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <Card
                    onClick={() => navigate("/login")}
                    className="overflow-hidden border border-border/50 bg-card hover:shadow-2xl transition-all duration-500 cursor-pointer group rounded-3xl h-full flex flex-col"
                  >
                    <div className="relative h-72 overflow-hidden mx-3 mt-3 rounded-2xl">
                      <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      <ImageWithFallback
                        src={trip.image}
                        alt={trip.destination}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg z-20 text-foreground">
                        {trip.duration}
                      </div>
                    </div>
                    <CardHeader className="pt-6">
                      <CardTitle className="text-2xl font-bold tracking-tight">{trip.destination}</CardTitle>
                      <CardDescription className="text-base mt-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        {trip.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto pb-6">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl py-6 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white transition-all duration-300 border-2"
                      >
                        Open Itinerary
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden bg-slate-900 text-white dark:bg-zinc-950 border-t border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40 dark:from-blue-900/50 dark:to-purple-900/50" />
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl lg:text-7xl font-extrabold mb-8 tracking-tight">
                Ready to Start Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white dark:from-purple-300 dark:to-white">
                  Adventure?
                </span>
              </h2>
              <p className="text-2xl mb-12 text-blue-100/90 font-medium max-w-2xl mx-auto">
                Join thousands of modern travelers who trust AI to curate their absolute perfect trips.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="text-lg px-12 py-8 rounded-full bg-white text-blue-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-900/50 font-bold border-0"
              >
                Get Started Free Today
              </Button>
            </motion.div>
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
      </ScrollExpandMedia>
    </div>
  );
}
