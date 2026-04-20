def build_itinerary_prompt(trip, user) -> str:
    days = (trip.end_date - trip.start_date).days + 1
    prefs = ", ".join(trip.preferences or [])
    women_prefs = trip.women_prefs or {}

    safety_note = ""
    if trip.safety_mode:
        active = [k for k, v in women_prefs.items() if v]
        safety_note = f"Safety mode is ON. Prioritize: {', '.join(active)}."

    return f"""
You are an expert travel planner. Create a detailed, personalized {days}-day itinerary.

USER PROFILE:
- Name: {user.full_name}

TRIP DETAILS:
- Destination: {trip.destination_name}
- Dates: {trip.start_date.date()} to {trip.end_date.date()} ({days} days)
- Budget: {f'₹{{trip.budget}}' if trip.budget else 'Not specified'}
- Travel style: {trip.travel_style or 'Not specified'}
- Interests: {prefs or 'General'}
- Accommodation type: {trip.stay_type or 'Any'}
- Accommodation features: {", ".join(trip.accommodation_prefs or []) or 'Standard'}
- Dietary preference: {trip.dietary_pref or 'None specified'}
- Minimum hotel rating: {trip.rating_min or 3} stars
- {safety_note}

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{{
  "destination": "string",
  "total_days": number,
  "budget_estimate": "string",

  "days": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "morning": {{
        "activity": "string",
        "place_name": "string",
        "description": "string",
        "tips": "string",
        "location": [lat, lon],
        "safety_level": "green|yellow|red",
        "distance_km": number,
        "entry_ticket": "Free|₹XXX|Not Required",
        "booking_platform": "BookMyShow|Klook|GetYourGuide|Direct|None"
      }},
      "afternoon": {{ ...same as morning... }},
      "evening": {{ ...same as morning... }},
      "stay": {{
        "name": "string",
        "type": "string",
        "area": "string",
        "approx_cost": "string",
        "rating": number,
        "amenities": ["string"],
        "safety_rating": "green|yellow|red",
        "booking_platform": "MakeMyTrip|Booking.com|Airbnb|Goibibo|Hotels.com|OYO|Direct"
      }}
    }}
  ],

  "hotels": [
    {{
      "name": "string",
      "type": "string",
      "area": "string",
      "price_per_night": "₹XXX",
      "total_cost": "₹XXX",
      "rating": number,
      "amenities": ["string"],
      "safety_rating": "green|yellow|red",
      "why_recommended": "string (1-2 sentences)",
      "booking_platform": "MakeMyTrip|Booking.com|Airbnb|Goibibo|Hotels.com|OYO|Direct",
      "booking_search_name": "exact hotel name as it appears on booking platforms"
    }}
  ],

  "packing_tips": ["string"],
  "local_tips": ["string"],
  "safety_tips": ["string"],

  "safety_info": {{
    "emergency_contacts": [
      {{ "label": "string", "number": "string" }}
    ],
    "nearest_police": {{
      "name": "string",
      "distance": "X.X km",
      "address": "string"
    }},
    "nearest_hospital": {{
      "name": "string",
      "distance": "X.X km",
      "address": "string"
    }},
    "nearby_essentials": [
      {{ "label": "string", "name": "string", "distance": "X.X km", "type": "pharmacy|store|atm|clinic" }}
    ]
  }},

  "special_events": [
    {{
      "name": "string",
      "type": "festival|concert|market|exhibition",
      "date": "YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD",
      "venue": "string",
      "description": "string",
      "ticket_price": "Free|₹XXX",
      "booking_platform": "BookMyShow|Insider.in|Paytm|Eventbrite|Direct|Free",
      "booking_search_query": "event name and city for searching on the booking platform"
    }}
  ],

  "restaurants": [
    {{
      "name": "string",
      "cuisine": "string",
      "description": "string",
      "specialty": "string",
      "avg_cost": "₹XXX",
      "dietary_options": ["string"],
      "safety_rating": "green|yellow|red",
      "location": [lat, lon],
      "booking_platform": "Zomato|Swiggy|EazyDiner|Dineout|Direct",
      "booking_search_name": "exact restaurant name as it appears on the platform"
    }}
  ],

  "cost_breakdown": [
    {{
      "category": "string",
      "color": "#hexcolor",
      "items": [
        {{ "label": "string", "amount": number, "note": "optional string" }}
      ]
    }}
  ]
}}

RULES:
- safety_level / safety_rating: "green" = safe/well-lit/popular, "yellow" = moderate caution, "red" = avoid at night
- hotels: provide 3 options at different price points within the budget
- special_events: list 2-4 real or plausible cultural events happening during the trip dates
- cost_breakdown: 5 categories — Accommodation, Food & Dining, Activities & Entry, Transport, Miscellaneous
- restaurants: Must strictly follow the dietary preference (Veg/Non-Veg/Vegan) and include local specialties
- location: real approximate [lat, lon] coordinates for the destination's places
- booking_platform: pick the most commonly used platform in India for that type of business
- booking_search_name: use the exact name someone would type to search for this place on the suggested platform
- ALL fields must be present and AI-generated — do not omit any section
- Respond ONLY with valid JSON. No markdown, no explanation, no trailing commas.
"""
