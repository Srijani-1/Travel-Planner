import json, re
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm

APP_NAME = "recommender"

async def generate_recommendations(user, past_trips) -> list:
    agent = LlmAgent(
        name="recommender_agent",
        model=LiteLlm(model="openrouter/qwen/qwen-2.5-72b-instruct"),
        description="Recommends travel destinations",
        instruction="You are a travel expert. Respond only with strict valid JSON. No markdown.",
    )

    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME, user_id=str(user.id), session_id=f"rec_{user.id}"
    )
    runner = Runner(agent=agent, app_name=APP_NAME, session_service=session_service)

    past = [{"destination": t.destination_name, "style": t.travel_style, "prefs": t.preferences}
            for t in past_trips]

    prompt = f"""
Based on this user's past trips: {json.dumps(past)}
Their preferences: travel_style={getattr(past_trips[0], 'travel_style', 'N/A') if past_trips else 'any'},
dietary={getattr(past_trips[0], 'dietary_pref', 'any') if past_trips else 'any'}

Recommend 3 new destinations they would love.

Return ONLY this JSON array:
[
  {{
    "destination": "City, Country",
    "description": "One sentence why they'd love it",
    "duration": "X days",
    "budget": "$X,XXX - $X,XXX",
    "tag": "Beach|Culture|Food|Adventure|Nature",
    "tag_color": "from-cyan-400 to-blue-500",
    "women_safe": true,
    "image_query": "destination landmark travel photography"
  }}
]
"""
    message = Content(role="user", parts=[Part(text=prompt)])
    result_text = ""
    async for event in runner.run_async(
        user_id=str(user.id), session_id=f"rec_{user.id}", new_message=message
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                if part.text:
                    result_text += part.text

    clean = re.sub(r'```json|```', '', result_text).strip()
    match = re.search(r'(\[.*\])', clean, re.DOTALL)
    clean = match.group(1) if match else clean
    try:
        try:
            recs = json.loads(clean)
            if not recs or not isinstance(recs, list) or len(recs) == 0:
                raise ValueError("Empty or invalid recommendations from AI")
            return recs
        except:
            clean = re.sub(r',\s*([\]}])', r'\1', clean)
            recs = json.loads(clean)
            if not recs: raise ValueError("Empty fallback")
            return recs
    except Exception as e:
        print(f"AI Recommender Error: {e}")
        # Return fallback items
        return [
            {
                "destination": "Santorini, Greece",
                "description": "Breathtaking sunsets and iconic blue-domed churches.",
                "duration": "5 days",
                "budget": "$1,500 - $2,500",
                "tag": "Beach",
                "women_safe": True
            },
            {
                "destination": "Kyoto, Japan",
                "description": "Serene temples and beautiful cherry blossoms.",
                "duration": "7 days",
                "budget": "$2,000 - $3,500",
                "tag": "Culture",
                "women_safe": True
            }
        ]