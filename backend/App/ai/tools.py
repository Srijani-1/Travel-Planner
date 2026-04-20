import httpx
import os

async def get_weather_forecast(destination: str, date: str) -> dict:
    """Fetch weather for destination on a given date."""
    # Call OpenWeatherMap or similar
    return {"temp": "28°C", "condition": "Sunny"}

async def search_nearby_places(lat: float, lon: float, type: str) -> list:
    """Search Google Places API for nearby hotels/restaurants/attractions."""
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params={
            "location": f"{lat},{lon}",
            "radius": 5000,
            "type": type,
            "key": os.getenv("GOOGLE_PLACES_API_KEY")
        })
    return resp.json().get("results", [])[:5]
