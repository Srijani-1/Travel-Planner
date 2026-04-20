import json
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from .agents import build_itinerary_agent
from .prompts import build_itinerary_prompt
from .. import models, schemas

APP_NAME = "travel_planner"

async def generate_itinerary(trip: models.Trip, user: models.User) -> dict:
    agent = build_itinerary_agent()
    session_service = InMemorySessionService()

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=str(user.id),
        session_id=f"trip_{trip.id}"
    )

    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service
    )

    prompt = build_itinerary_prompt(trip, user)

    message = Content(role="user", parts=[Part(text=prompt)])

    result_text = ""
    async for event in runner.run_async(
        user_id=str(user.id),
        session_id=f"trip_{trip.id}",
        new_message=message
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                if part.text:
                    result_text += part.text

    import re
    # Extract JSON content if the model surrounded it with text or markdown
    json_match = re.search(r'(\{.*\})', result_text, re.DOTALL)
    clean = json_match.group(1) if json_match else result_text.strip()
    
    # Strip markdown fences just in case re.search didn't catch it correctly
    clean = clean.strip().removeprefix("```json").removesuffix("```").strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        # LLMs often leave trailing commas which break standard JSON parsers
        fixed_json = re.sub(r',\s*([\]}])', r'\1', clean)
        return json.loads(fixed_json)
