import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TripGeneratingLoader } from "../components/TripGeneratingLoader";

export function PlanTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidatingDestination, setIsValidatingDestination] = useState(false);
  const [destinationError, setDestinationError] = useState("");
  const [isValidDest, setIsValidDest] = useState(false);

  // Form state
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budget, setBudget] = useState([5000]);
  const [stayType, setStayType] = useState("");
  const [rating, setRating] = useState([3]);
  const [safetyMode, setSafetyMode] = useState(false);
  const [accommodationFeatures, setAccommodationFeatures] = useState<string[]>([]);
  const [dietary, setDietary] = useState("None");
  const [customInterest, setCustomInterest] = useState("");
  const [customFeature, setCustomFeature] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [womenPrefs, setWomenPrefs] = useState({
    womenOnlyDriver: false,
    womenSafeStays: false,
    avoidLateNight: false,
    shareLocation: false,
  });

  const totalSteps = 6;
  const preferenceOptions = ["Adventure", "Relaxation", "Culture", "Food"];
  const stayOptions = ["Hotel", "Hostel", "Airbnb", "Resort", "Guesthouse"];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get("destination");
    if (dest) setDestination(dest);
  }, []);

  const togglePreference = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1: return !!destination && !!duration && !!startDate && !!endDate && peopleCount > 0 && isValidDest;
      case 2: return preferences.length > 0;
      case 3: return !!stayType && accommodationFeatures.length > 0;
      case 4: return dietary !== "None";
      case 5: return budget[0] > 0;
      default: return true;
    }
  };

  const handleDestinationBlur = async () => {
    if (!destination.trim()) {
      setDestinationError("");
      setIsValidDest(false);
      return;
    }
    setIsValidatingDestination(true);
    setDestinationError("");
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      const result = geoData.results?.[0];

      // Reject if no result, or population is too small to be a real destination
      if (!result || (result.population ?? 0) < 1000) {
        setDestinationError("⚠️ Not a valid destination. Try a well-known city or country name.");
        setIsValidDest(false);
      } else {
        setDestinationError("");
        setIsValidDest(true);
      }
    } catch {
      setDestinationError("Failed to validate. Please check your connection.");
      setIsValidDest(false);
    } finally {
      setIsValidatingDestination(false);
    }
  };

  const handleNext = async () => {
    // STEP 1 special validation FIRST
    if (step === 1 && !isValidDest) {
      setIsValidatingDestination(true);

      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
        );

        const geoData = await geoRes.json();
        const result = geoData.results?.[0];

        if (!result || (result.population ?? 0) < 1000) {
          setDestinationError(
            "⚠️ Not a valid destination. Try a well-known city or country name."
          );
          setIsValidatingDestination(false);
          return;
        }

        setDestinationError("");
        setIsValidDest(true);
      } catch {
        toast.error("Failed to validate destination. Please try again.");
        setIsValidatingDestination(false);
        return;
      }

      setIsValidatingDestination(false);
    }

    // NOW validate full step
    if (validateStep(step)) {
      setShowWarning(false);

      if (step < totalSteps) {
        setStep((prev) => prev + 1);
      }
    } else {
      setShowWarning(true);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate) return;
    setIsGenerating(true);
    try {
      let lat = 0, lon = 0;
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();
        if (geoData.results?.[0]) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
        } else {
          toast.error("Invalid destination. Please enter a valid city, country, or place.");
          setIsGenerating(false);
          return;
        }
      } catch (e) {
        console.error("Geocoding failed", e);
        toast.error("Failed to validate destination. Please try again.");
        setIsGenerating(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/trips/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination_name: destination,
          destination_lat: lat,
          destination_lon: lon,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          budget: budget[0],
          people_count: peopleCount,
          travel_style: preferences[0] || "Solo",
          preferences,
          stay_type: stayType,
          rating_min: rating[0],
          safety_mode: safetyMode,
          women_prefs: womenPrefs,
          accommodation_prefs: accommodationFeatures,
          dietary_pref: dietary,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("access_token");
        toast.error("Session expired. Please login again.");
        navigate("/");
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate");
      navigate(`/dashboard/itinerary/${data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Where do you want to go?</h2>
              <p className="text-gray-600">Tell us about your dream destination</p>
            </div>

            <div className="space-y-4">
              {/* Destination — single input with inline validation */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <div className="relative">
                  <Input
                    id="destination"
                    placeholder="e.g., Paris, France"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setIsValidDest(false);
                      setDestinationError("");
                    }}
                    onBlur={handleDestinationBlur}
                    className={
                      destinationError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : isValidDest
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                    }
                  />
                  {isValidatingDestination && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {isValidDest && !isValidatingDestination && (
                    <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>
                  )}
                </div>
                {destinationError && (
                  <p className="text-xs font-semibold text-red-500">{destinationError}</p>
                )}
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 7"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              {/* Number of people */}
              <div className="space-y-2">
                <Label htmlFor="peopleCount">Number of People</Label>
                <Input
                  id="peopleCount"
                  type="number"
                  placeholder="e.g., 2"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger className="w-full">
                      <button className="inline-flex items-center justify-start gap-2 w-full h-9 px-4 py-2 rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger className="w-full">
                      <button className="inline-flex items-center justify-start gap-2 w-full h-9 px-4 py-2 rounded-md border bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {showWarning && (!destination || !duration || !startDate || !endDate || peopleCount <= 0) && (
                <p className="text-xs font-bold text-red-500">
                  ⚠️ Please fill in all destination, date, and people details.
                </p>
              )}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">What are your interests?</h2>
              <p className="text-gray-600">Select all that apply (the more, the better!)</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {preferenceOptions.map((pref) => (
                <Badge
                  key={pref}
                  variant={preferences.includes(pref) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-base"
                  onClick={() => togglePreference(pref)}
                >
                  {pref}
                </Badge>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-semibold">Can't find what you like? Add your own:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Scuba Diving"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customInterest.trim()) {
                      togglePreference(customInterest.trim());
                      setCustomInterest("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (customInterest.trim()) {
                      togglePreference(customInterest.trim());
                      setCustomInterest("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {preferences.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Selected: {preferences.join(", ")}
                </p>
              </div>
            )}

            {showWarning && preferences.length === 0 && (
              <p className="text-sm font-bold text-red-500 animate-pulse">
                ⚠️ Please select at least one interest or add a custom one to continue.
              </p>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Where will you stay?</h2>
              <p className="text-gray-600">Choose your preferred accommodation type</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stayOptions.map((option) => (
                <Card
                  key={option}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${stayType === option ? "border-blue-600 border-2" : ""
                    }`}
                  onClick={() => setStayType(option)}
                >
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold">{option}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Minimum Rating: {rating[0]} stars</Label>
              <Slider
                value={rating}
                onValueChange={setRating}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>1 star</span>
                <span>5 stars</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t">
              <Label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Common Features
              </Label>
              <div className="flex flex-wrap gap-2">
                {["Sea-side View", "Pool", "Free WiFi", "Breakfast Included"].map((feature) => (
                  <Badge
                    key={feature}
                    variant={accommodationFeatures.includes(feature) ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 transition-all ${accommodationFeatures.includes(feature)
                      ? "bg-blue-600 shadow-md"
                      : "hover:border-blue-400"
                      }`}
                    onClick={() =>
                      setAccommodationFeatures((prev) =>
                        prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
                      )
                    }
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <Label className="text-sm font-semibold">Custom features or views:</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Private Balcony"
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customFeature.trim()) {
                      setAccommodationFeatures((prev) => [...prev, customFeature.trim()]);
                      setCustomFeature("");
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (customFeature.trim()) {
                      setAccommodationFeatures((prev) => [...prev, customFeature.trim()]);
                      setCustomFeature("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {showWarning && (!stayType || accommodationFeatures.length === 0) && (
              <p className="text-sm font-bold text-red-500 animate-pulse mt-4">
                ⚠️ Please select your stay type and at least one feature.
              </p>
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Food & Dining</h2>
              <p className="text-gray-600">What are your dietary preferences for this trip?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "Veg", label: "Vegetarian", icon: "🥦" },
                { id: "Non-Veg", label: "Non-Vegetarian", icon: "🍖" },
                { id: "Vegan", label: "Vegan", icon: "🌱" },
              ].map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${dietary === option.id ? "border-blue-600 border-2 bg-blue-50/30" : ""
                    }`}
                  onClick={() => setDietary(option.id)}
                >
                  <CardContent className="pt-6 text-center space-y-2">
                    <div className="text-3xl">{option.icon}</div>
                    <p className="font-bold">{option.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {showWarning && dietary === "None" && (
              <p className="text-sm font-bold text-red-500 animate-pulse mt-4">
                ⚠️ Please select your dietary preference.
              </p>
            )}
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Finally, what's your budget?</h2>
              <p className="text-gray-600">
                Based on your {stayType} preference, {dietary} diet, and {duration}-day trip
                for {peopleCount} {peopleCount === 1 ? "person" : "people"} — set a total budget.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Budget: ₹{budget[0].toLocaleString()}</Label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  min={5000}
                  max={200000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>₹5,000</span>
                  <span>₹2,00,000</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: "Economy", multiplier: 1500, color: "emerald", desc: "Hostels & Street Food" },
                  { label: "Standard", multiplier: 4500, color: "blue", desc: "3-4★ Hotels & Cafes" },
                  { label: "Luxury", multiplier: 12000, color: "purple", desc: "Top Resorts & Fine Dining" },
                ].map((tier) => {
                  const est = tier.multiplier * (parseInt(duration) || 1) * peopleCount;
                  const isActive = Math.abs(budget[0] - est) < 500;
                  return (
                    <Card
                      key={tier.label}
                      className={`cursor-pointer transition-all hover:scale-105 ${isActive ? `border-2` : ""
                        }`}
                      onClick={() => setBudget([est])}
                    >
                      <CardContent className="pt-6 text-center">
                        <p className="font-bold">{tier.label}</p>
                        <p className="text-lg font-black">₹{est.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          ₹{Math.round(est / (parseInt(duration) || 1) / peopleCount).toLocaleString()}/person/day
                        </p>
                        <p className="text-[10px] text-gray-400">{tier.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {budget[0] > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    ₹{budget[0].toLocaleString()} total · ₹{Math.round(budget[0] / (parseInt(duration) || 1)).toLocaleString()}/day ·
                    ₹{Math.round(budget[0] / (parseInt(duration) || 1) / peopleCount).toLocaleString()}/person/day
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold mb-2">Safety Preferences</h2>
              <p className="text-gray-600">Enable enhanced safety features for your trip</p>
            </div>

            <Card className={safetyMode ? "border-pink-400 border-2 bg-pink-50/50 dark:bg-pink-950/20" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌸</span>
                      <h3 className="font-semibold">Women Safety Mode</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      When enabled, we'll prioritize safe zones, well-lit routes, verified
                      transportation, and provide emergency contacts.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Safe zone highlighting on maps</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Emergency contacts for your destination</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Women-only driver options</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Women-verified accommodation badges</li>
                      <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Safety tips and local guidelines</li>
                    </ul>
                  </div>
                  <Switch checked={safetyMode} onCheckedChange={setSafetyMode} />
                </div>
              </CardContent>
            </Card>

            {safetyMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-semibold text-pink-700 dark:text-pink-400">
                  🌸 Women-friendly preferences
                </p>

                {[
                  { key: "womenOnlyDriver", label: "Prefer women-only drivers", desc: "Filter rides to show verified female drivers" },
                  { key: "womenSafeStays", label: "Highlight women-safe stays", desc: "Women-only or highly rated safe accommodations" },
                  { key: "avoidLateNight", label: "Avoid late-night solo activities", desc: "Schedule activities before 9PM where possible" },
                  { key: "shareLocation", label: "Share live location with contacts", desc: "Auto-share itinerary with emergency contacts" },
                ].map((opt) => (
                  <Card key={opt.key} className="border-pink-100 dark:border-pink-900">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                        <Switch
                          checked={womenPrefs[opt.key as keyof typeof womenPrefs]}
                          onCheckedChange={(val) =>
                            setWomenPrefs((prev) => ({ ...prev, [opt.key]: val }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    ✓ Safety mode enabled. Your itinerary will include enhanced safety features.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Review summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Review Your Preferences</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600 dark:text-gray-400">Destination:</span>{" "}<span className="font-medium">{destination || "Not set"}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Duration:</span>{" "}<span className="font-medium">{duration || "Not set"} days</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Interests:</span>{" "}<span className="font-medium">{preferences.length > 0 ? preferences.join(", ") : "None selected"}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Budget:</span>{" "}<span className="font-medium">₹{budget[0].toLocaleString()} ({peopleCount} {peopleCount === 1 ? "person" : "people"})</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Stay Type:</span>{" "}<span className="font-medium">{stayType || "Not selected"}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Features:</span>{" "}<span className="font-medium text-blue-600">{accommodationFeatures.length > 0 ? accommodationFeatures.join(", ") : "None"}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Dietary:</span>{" "}<span className="font-medium text-green-600">{dietary}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Safety Mode:</span>{" "}<span className={`font-medium ${safetyMode ? "text-pink-600" : "text-gray-500"}`}>{safetyMode ? "🌸 Enabled" : "Off"}</span></p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {isGenerating && <TripGeneratingLoader destination={destination} />}
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1>Plan Your Trip</h1>
          <p className="text-gray-600">Let's create your perfect itinerary in a few simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext} disabled={isValidatingDestination}>
                  {isValidatingDestination ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Itinerary"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
