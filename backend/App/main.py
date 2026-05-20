import asyncio
from fastapi import FastAPI, Depends
from .database import engine, Base
from . import models
from .core.auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
from .routers import login, register,trips,profile,rides, saved_places, sos, stays, stats, recommendations, images, community
from .routers.sos import ws_location, start_missed_checkin_watcher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"REQUEST: {request.method} {request.url}")

    try:
        response = await call_next(request)
        print(f"RESPONSE STATUS: {response.status_code}")
        return response

    except Exception as e:
        print("ERROR OCCURRED:", str(e))
        raise e
        
app.include_router(login.router)
app.include_router(register.router)
app.include_router(trips.router)
app.include_router(profile.router)
app.include_router(rides.router)
app.include_router(saved_places.router)
app.include_router(sos.router)
app.include_router(stays.router)
app.include_router(stats.router)
app.include_router(images.router)
app.include_router(recommendations.router)
app.include_router(community.router)

@app.websocket("/ws/location")
async def websocket_endpoint(websocket):
    await ws_location(websocket)

@app.on_event("startup")
async def startup():
    asyncio.create_task(start_missed_checkin_watcher())

@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
@app.get("/")
def root():
    return {"message": "Travel Agent Backend Running"}
