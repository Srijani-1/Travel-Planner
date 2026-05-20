export interface SampleRec {
    destination: string;
    description: string;
    duration: string;
    durationDays: number;
    tag: "Beach" | "Culture" | "Food" | "Adventure" | "Nature";
    budget: string;
    budgetValue: number;
    women_safe: boolean;
    imageUrl: string;
    preferences: string[];
    stayType: "Hotel" | "Hostel" | "Airbnb" | "Resort" | "Guesthouse";
    dietary: "Veg" | "Non-Veg" | "Vegan";
}

export const sampleRecommendations: SampleRec[] = [
    {
        destination: "Goa",
        description:
            "Sun-soaked beaches, Portuguese heritage, and vibrant beach shacks make Goa India's most beloved coastal escape.",
        duration: "5 Days",
        durationDays: 5,
        tag: "Beach",
        budget: "₹18,000 – ₹35,000",
        budgetValue: 25000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
        preferences: ["Relaxation", "Culture", "Food"],
        stayType: "Resort",
        dietary: "Non-Veg",
    },
    {
        destination: "Manali",
        description:
            "Dramatic Himalayan peaks, roaring rivers, and cosy cafés buried in snow — adventure finds you at every turn.",
        duration: "6 Days",
        durationDays: 6,
        tag: "Adventure",
        budget: "₹20,000 – ₹45,000",
        budgetValue: 32000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
        preferences: ["Adventure", "Nature"],
        stayType: "Guesthouse",
        dietary: "Veg",
    },
    {
        destination: "Jaipur",
        description:
            "The Pink City dazzles with grand forts, kaleidoscopic bazaars, and a royal culinary heritage waiting to be savoured.",
        duration: "4 Days",
        durationDays: 4,
        tag: "Culture",
        budget: "₹12,000 – ₹28,000",
        budgetValue: 18000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
        preferences: ["Culture", "Food"],
        stayType: "Hotel",
        dietary: "Veg",
    },
    {
        destination: "Alleppey",
        description:
            "Glide through emerald backwaters on a houseboat, surrounded by swaying palms, paddy fields, and birdsong.",
        duration: "4 Days",
        durationDays: 4,
        tag: "Nature",
        budget: "₹15,000 – ₹30,000",
        budgetValue: 22000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&q=80",
        preferences: ["Nature", "Relaxation"],
        stayType: "Resort",
        dietary: "Non-Veg",
    },
    {
        destination: "Andaman Islands",
        description:
            "Crystal-clear turquoise lagoons, vibrant coral reefs, and untouched white-sand beaches far off the mainland.",
        duration: "7 Days",
        durationDays: 7,
        tag: "Beach",
        budget: "₹35,000 – ₹70,000",
        budgetValue: 50000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80",
        preferences: ["Adventure", "Relaxation", "Nature"],
        stayType: "Resort",
        dietary: "Non-Veg",
    },
    {
        destination: "Rishikesh",
        description:
            "Conquer white-water rapids by day, unwind with riverside yoga at sunset — the adventure capital of India.",
        duration: "4 Days",
        durationDays: 4,
        tag: "Adventure",
        budget: "₹10,000 – ₹22,000",
        budgetValue: 15000,
        women_safe: true,
        imageUrl:
            "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80",
        preferences: ["Adventure", "Culture", "Relaxation"],
        stayType: "Hostel",
        dietary: "Veg",
    },
];
