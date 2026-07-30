from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from backend.database import get_db, engine
from backend.models import Locker

app = FastAPI(title="CloudLocker API")


@app.get("/")
def home():
    return {"message": "Welcome to CloudLocker"}


@app.get("/lockers")
def get_lockers(db: Session = Depends(get_db)):
    lockers = db.query(Locker).all()
    return lockers

@app.get("/health")
def health():
    with engine.connect():
        return {"database": "Connected"}
