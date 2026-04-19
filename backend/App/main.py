from fastapi import FastAPI, Depends
from .database import engine, Base
from . import models
from .core.auth import get_current_user
from .routers import login, register
# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Travel API")

app.include_router(login.router)
app.include_router(register.router)
@app.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
@app.get("/")
def root():
    return {"message": "Travel Agent Backend Running"}
