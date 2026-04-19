import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./travelai.db")

connect_args = {}

if DB_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif DB_URL.startswith("postgresql"):
    connect_args = {"sslmode": "require"}

engine = create_engine(
    DB_URL,
    connect_args={
        **connect_args,
        "sslmode": "require"
    },
    pool_pre_ping=True
)

print("📦 Using DB:", DB_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
