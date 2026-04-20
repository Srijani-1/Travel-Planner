from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from .tools import get_weather_forecast, search_nearby_places

def build_itinerary_agent() -> LlmAgent:
    return LlmAgent(
        name="itinerary_agent",
        model=LiteLlm(model="openrouter/qwen/qwen-2.5-72b-instruct"),
        description="Generates personalized travel itineraries",
        instruction="""You are a travel planning expert. 
        Always respond with strictly valid JSON only. 
        Ensure all commas are correctly placed and do NOT include trailing commas at the end of lists or objects. 
        Respond only with the JSON block, no markdown, and no extra text.""",
        tools=[get_weather_forecast, search_nearby_places],  # optional
    )
