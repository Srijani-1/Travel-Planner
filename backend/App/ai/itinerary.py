import json
from openai import AsyncOpenAI
from .prompts import build_itinerary_prompt
import os
import httpx

client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

async def get_city_center(destination: str) -> tuple[float, float] | None:
    """Get verified city center coordinates from geocoding API."""
    try:
        async with httpx.AsyncClient() as http:
            resp = await http.get(
                f"https://geocoding-api.open-meteo.com/v1/search",
                params={"name": destination, "count": 1, "language": "en", "format": "json"},
                timeout=5,
            )
            data = resp.json()
            if data.get("results"):
                r = data["results"][0]
                return r["latitude"], r["longitude"]
    except Exception:
        pass
    return None

def is_coordinate_valid(lat: float, lon: float, center_lat: float, center_lon: float, max_km: float = 30) -> bool:
    """Check if coordinate is within max_km of city center (rough check)."""
    if lat == 0 and lon == 0:
        return False
    # 1 degree ≈ 111km
    dist = ((lat - center_lat) ** 2 + (lon - center_lon) ** 2) ** 0.5 * 111
    return dist <= max_km

def sanitize_coordinates(data: dict, center_lat: float, center_lon: float) -> dict:
    """Replace bad/water coordinates with city center + small random offset."""
    import random

    def fix_loc(loc):
        if not loc or not isinstance(loc, list) or len(loc) < 2:
            return [center_lat, center_lon]
        lat, lon = loc[0], loc[1]
        if not is_coordinate_valid(lat, lon, center_lat, center_lon):
            # Offset by up to 0.02 degrees (~2km) so markers don't all stack
            return [
                center_lat + random.uniform(-0.02, 0.02),
                center_lon + random.uniform(-0.02, 0.02),
            ]
        return [lat, lon]

    # Fix activity locations
    for day in data.get("days", []):
        for period in ["morning", "afternoon", "evening"]:
            act = day.get(period, {})
            if "location" in act:
                act["location"] = fix_loc(act["location"])

    # Fix restaurant locations
    for rest in data.get("restaurants", []):
        if "location" in rest:
            rest["location"] = fix_loc(rest["location"])

    return data

async def generate_itinerary(trip, user):
    prompt = build_itinerary_prompt(trip, user)
    days = (trip.end_date - trip.start_date).days + 1
    budget = trip.budget or 0
    per_day = round(budget / days) if days > 0 else 0

    # Get verified city center BEFORE calling AI
    center = await get_city_center(trip.destination_name)
    center_lat, center_lon = center if center else (20.5937, 78.9629)

    response = await client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"""You are a travel planner AI.

HARD BUDGET RULE: Total trip cost MUST NOT exceed ₹{budget}.
Maximum per day: ₹{per_day}.
All cost fields must be numbers, not strings.

COORDINATE RULE: The city center of {trip.destination_name} is at 
latitude {center_lat:.4f}, longitude {center_lon:.4f}.
ALL location coordinates MUST be within 15km of this point.
NEVER place coordinates in water bodies, rivers, or outside the city.
Offset each location by 0.005-0.02 degrees from center so they don't stack.

Return ONLY valid JSON. No markdown. No explanation. No trailing commas."""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=8000,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    parsed = json.loads(raw.strip())

    # Post-process: fix any coordinates that still landed in water/outside city
    parsed = sanitize_coordinates(parsed, center_lat, center_lon)

    return parsed
