import json
# from google.adk.runners import Runner
# from google.adk.sessions import InMemorySessionService
# from google.genai.types import Content, Part
from openai import AsyncOpenAI
from .agents import build_itinerary_agent
from .prompts import build_itinerary_prompt
from .. import models, schemas
import os

APP_NAME = "travel_planner"

client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

async def generate_itinerary(trip, user):

    prompt = build_itinerary_prompt(trip, user)

    response = await client.chat.completions.create(
    model="openai/gpt-4o-mini",
    messages=[
        {
            "role": "system",
            "content": """
You are a travel planner AI.

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanation
- No trailing commas
"""
        },
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0.3,
    max_tokens=10000,
)
    return json.loads(response.choices[0].message.content)
