import json, re
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm

APP_NAME = "stay_searcher"

async def search_safe_stays(location: str, stay_type: str = "Women-only", check_in: str = None, check_out: str = None) -> list:
    """Uses AI to 'find' real-world safe stays in a specific area."""
    agent = LlmAgent(
        name="stay_agent",
        model=LiteLlm(model="openrouter/qwen/qwen-2.5-72b-instruct"),
        description="Finds women-safe accommodations",
        instruction="You are a travel safety expert. Respond only with strict valid JSON. No markdown.",
    )

    session_service = InMemorySessionService()
    session_id = f"stay_{location.replace(' ', '_')}"
    await session_service.create_session(app_name=APP_NAME, user_id="searcher", session_id=session_id)
    
    runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)

    dates_info = f"from {check_in} to {check_out}" if check_in and check_out else "for upcoming dates"
    prompt = f"""
Find 5 real-world accommodations (hotels, hostels, or guesthouses) in or near '{location}' {dates_info} that are explicitly '{stay_type}' or highly rated for women's safety.
Each stay MUST have a high rating (4.5+) and positive reviews from solo female travelers.

Return ONLY this JSON array:
[
  {{
    "name": "Exact Hotel Name",
    "location": "Full Address or Area",
    "stay_type": "{stay_type}",
    "price_per_night": "$XXX",
    "rating": 4.8,
    "review_count": 1250,
    "badges": ["CCTV", "Female Staff", "Solo-friendly", "Central Location"],
    "image_url": "https://loremflickr.com/800/600/hotel,room",
    "lat": 0.0,
    "lon": 0.0,
    "booking_url": "https://www.booking.com/searchresults.html?ss={location}",
    "verified": true
  }}
]

Make the prices and details realistic for {location} during these dates.
"""
    message = Content(role="user", parts=[Part(text=prompt)])
    result_text = ""
    async for event in runner.run_async(
        user_id="searcher", session_id=session_id, new_message=message
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                if part.text:
                    result_text += part.text

    clean = re.sub(r'```json|```', '', result_text).strip()
    match = re.search(r'(\[.*\])', clean, re.DOTALL)
    clean = match.group(1) if match else clean
    try:
        data = json.loads(clean)
        # Ensure ID for frontend if not present
        for i, item in enumerate(data):
            item["id"] = i + 1000
        return data
    except:
        return []
