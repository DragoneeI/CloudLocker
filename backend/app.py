from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler

from backend.routers import health, lockers, users, reservation_router, access_log_router
from backend.database import SessionLocal
from backend.services.reservation_service import expire_reservations

app = FastAPI(title="CloudLocker API")


@app.get("/")
def home():
    return {"message": "Welcome to CloudLocker"}


app.include_router(health.router)
app.include_router(lockers.router)
app.include_router(users.router)
app.include_router(reservation_router)
app.include_router(access_log_router)

scheduler = BackgroundScheduler()


def run_expiration_check():
    db = SessionLocal()

    try:
        expire_reservations(db)
    finally:
        db.close()


scheduler.add_job(
    run_expiration_check,
    "interval",
    minutes=1
)

scheduler.start()
