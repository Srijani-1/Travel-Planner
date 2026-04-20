from fastapi import FastAPI, Depends
from .database import engine, Base
from . import models
from .core.auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware
from .routers import login, register,trips,profile
# Create tables
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(login.router)
app.include_router(register.router)
app.include_router(trips.router)
app.include_router(profile.router)
@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
@app.get("/")
def root():
    return {"message": "Travel Agent Backend Running"}
