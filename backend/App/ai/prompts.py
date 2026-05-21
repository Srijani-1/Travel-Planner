def build_itinerary_prompt(trip, user) -> str:
    days = (trip.end_date - trip.start_date).days + 1
    prefs = ", ".join(trip.preferences or [])
    women_prefs = trip.women_prefs or {}

    safety_note = ""
    if trip.safety_mode:
        active = [k for k, v in women_prefs.items() if v]
        safety_note = f"Safety mode is ON. Prioritize: {', '.join(active)}."

    budget = trip.budget or 0
    per_day = round(budget / days) if days > 0 else 0
    per_person_per_day = round(per_day / trip.people_count) if trip.people_count > 0 else per_day

    return f"""
You are an expert travel planner with deep knowledge of real hotel and activity prices worldwide.
Create a detailed, personalized {days}-day itinerary.

USER PROFILE:
- Name: {user.full_name}

TRIP DETAILS:
- Destination: {trip.destination_name}
- Dates: {trip.start_date.date()} to {trip.end_date.date()} ({days} days)
- People: {trip.people_count}
- Travel style: {trip.travel_style or 'Not specified'}
- Interests: {prefs or 'General'}
- Accommodation type: {trip.stay_type or 'Any'}
- Accommodation features: {", ".join(trip.accommodation_prefs or []) or 'Standard'}
- Dietary preference: {trip.dietary_pref or 'None specified'}
- Minimum hotel rating: {trip.rating_min or 3} stars

USER'S STATED BUDGET: ₹{budget} total for {trip.people_count} people for {days} days
(₹{per_day}/day · ₹{per_person_per_day}/person/day)

{safety_note}

═══════════════════════════════════════════
PRICING PHILOSOPHY — READ CAREFULLY
═══════════════════════════════════════════

1. USE REAL MARKET PRICES — not invented numbers that fit the budget.
   Research what hotels, activities, and meals ACTUALLY cost in {trip.destination_name}.
   
2. NEVER lie about prices to fit the budget. A ₹10,000 hotel is ₹10,000.
   If the user's budget cannot cover realistic costs, that is OK — be honest.

3. HOTEL PRICING — use actual market minimums for {trip.destination_name}:
   - Economy tier: Cheapest decent option with minimum {trip.rating_min or 3} stars (hostels, budget hotels, OYO)
   - Standard tier: Mid-range 3-4 star hotel — typical tourist choice
   - Luxury tier: Premium 4-5 star hotel — best experience
   Each tier's price_per_night must reflect REAL market rates for {trip.destination_name}, 
   not a percentage of the user's budget.

4. BUDGET CHECK — after computing all realistic costs, sum them:
   realistic_total = accommodation + food + activities + transport + misc
   
   IF realistic_total <= ₹{budget}:
     → set budget_estimate = realistic_total
     → set budget_warning = null
     → set budget_sufficient = true
   
   IF realistic_total > ₹{budget}:
     → set budget_estimate = realistic_total (the REAL cost, not the user's budget)
     → set budget_warning = "Your budget of ₹{budget} is below the minimum realistic cost 
       of ₹[realistic_total] for {trip.destination_name}. Consider increasing your budget 
       or shortening your trip."
     → set budget_sufficient = false
     → still include Economy/Standard/Luxury hotel tiers with REAL prices
     → adjust activities toward free/cheap options where possible but NEVER fake hotel prices

5. cost_breakdown items must reflect REAL costs — their sum = budget_estimate (not user's budget)

═══════════════════════════════════════════

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
{{
  "destination": "string",
  "total_days": number,
  "budget_estimate": number,          ← REAL total cost (may exceed user's stated budget)
  "budget_sufficient": true|false,    ← false if budget_estimate > user's budget of {budget}
  "budget_warning": "string or null", ← non-null warning message when budget is insufficient
  "minimum_realistic_budget": number, ← minimum possible realistic cost for Economy tier across all {days} days

  "days": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "string",
      "day_budget": number,           ← realistic cost for this day
      "morning": {{
        "activity": "string",
        "place_name": "string",
        "description": "string",
        "tips": "string",
        "location": [lat, lon],
        "safety_level": "green|yellow|red",
        "distance_km": number,
        "entry_ticket": "Free|₹XXX|Not Required",
        "cost": number,
        "booking_platform": "BookMyShow|Klook|GetYourGuide|Direct|None",
        "booking_search_name": "string",
        "booking_url": "string"
      }},
      "afternoon": {{ "...same as morning..." }},
      "evening": {{ "...same as morning..." }},
      "stay": {{
        "name": "string",
        "type": "string",
        "area": "string",
        "approx_cost": number,        ← real per-night cost
        "rating": number,
        "amenities": ["string"],
        "safety_rating": "green|yellow|red",
        "booking_platform": "MakeMyTrip|Booking.com|Airbnb|Goibibo|Hotels.com|OYO|Direct",
        "booking_search_name": "string",
        "booking_url": "string"
      }}
    }}
  ],

  "hotels": [
    {{
      "name": "string",
      "type": "string",
      "area": "string",
      "price_per_night": number,      ← REAL market rate — do NOT invent low prices
      "total_cost": number,           ← price_per_night × {days}
      "rating": number,
      "amenities": ["string"],
      "safety_rating": "green|yellow|red",
      "why_recommended": "string",
      "tier": "Economy|Standard|Luxury",
      "fits_budget": true|false,      ← does total_cost fit within user's ₹{budget}?
      "booking_platform": "MakeMyTrip|Booking.com|Airbnb|Goibibo|Hotels.com|OYO|Direct",
      "booking_search_name": "string",
      "booking_url": "https://www.booking.com/searchresults.html?ss=HOTEL_NAME+CITY&checkin={trip.start_date.date()}&checkout={trip.end_date.date()}&group_adults={trip.people_count}"
    }}
  ],

  "packing_tips": ["string"],
  "local_tips": ["string"],
  "safety_tips": ["string"],

  "safety_info": {{
    "emergency_contacts": [{{ "label": "string", "number": "string" }}],
    "nearest_police": {{ "name": "string", "distance": "X.X km", "address": "string" }},
    "nearest_hospital": {{ "name": "string", "distance": "X.X km", "address": "string" }},
    "nearby_essentials": [{{ "label": "string", "name": "string", "distance": "X.X km", "type": "pharmacy|store|atm|clinic" }}]
  }},

  "special_events": [
    {{
      "name": "string",
      "type": "festival|concert|market|exhibition",
      "date": "YYYY-MM-DD or YYYY-MM-DD to YYYY-MM-DD",
      "venue": "string",
      "description": "string",
      "ticket_price": number,
      "booking_platform": "BookMyShow|Insider.in|Paytm|Eventbrite|Direct|Free",
      "booking_search_name": "string",
      "booking_url": "string"
    }}
  ],

  "restaurants": [
    {{
      "name": "string",
      "cuisine": "string",
      "description": "string",
      "specialty": "string",
      "avg_cost": number,
      "dietary_options": ["string"],
      "safety_rating": "green|yellow|red",
      "location": [lat, lon],
      "booking_platform": "Zomato|Swiggy|EazyDiner|Dineout|Direct",
      "booking_search_name": "string",
      "booking_url": "string"
    }}
  ],

  "cost_breakdown": [
    {{
      "category": "string",
      "color": "#hexcolor",
      "subtotal": number,
      "items": [
        {{ "label": "string", "amount": number, "note": "optional string" }}
      ]
    }}
  ]
}}

STRICT RULES:
- BUDGET IS A HARD CEILING: cost_breakdown subtotals must sum to <= ₹{budget}
- hotel price_per_night = REAL market rate for {trip.destination_name} (not budget math)
- cost_breakdown subtotals must sum to budget_estimate (the real cost)
- special_events: 2-4 real or plausible cultural events during the trip dates
- IF budget_sufficient = false → still show all 3 hotel tiers with real prices; mark fits_budget appropriately
- safety_level: "green" = safe/popular, "yellow" = moderate caution, "red" = avoid at night
- hotels: ALWAYS 3 tiers — Economy / Standard / Luxury — with real prices
- booking_search_name: exact name to type into the platform's search bar
- booking_url: generate actual deep links with destination, checkin/checkout dates, and group size pre-filled wherever the platform supports it
- restaurants: follow dietary preference ({trip.dietary_pref or 'no restriction'})
- ALL location [lat, lon] must be real land coordinates inside {trip.destination_name} city limits
- ALL cost fields must be numbers (not strings like "₹500") — the frontend will format them
- location coordinates: MUST be real land-based coordinates for {trip.destination_name}. 
  Verify mentally that the lat/lon is inside the city, not in water, forest, or outside city limits.
  For restaurants and hotels, coordinates must be within 10km of the city center.
  If unsure of exact coordinates, use the city center coordinates with a small offset.
- For {trip.destination_name}, the approximate city center is near these coordinates — 
  use them as your anchor and offset by max 0.05 degrees for different locations.
- ALL fields must be present — do not omit any section
- Respond ONLY with valid JSON. No markdown, no trailing commas, no explanation.
"""
