from fastapi import FastAPI
from backend.database import engine

app = FastAPI(title="CloudLocker API")


@app.get("/")
def home():
    return {"message": "Welcome to CloudLocker"}


@app.get("/health")
def health():
    with engine.connect():
        return {"database": "Connected"}
