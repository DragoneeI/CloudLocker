from fastapi import FastAPI

from backend.routers import health, lockers, users, reservation_router, access_log_router

app = FastAPI(title="CloudLocker API")


@app.get("/")
def home():
    return {"message": "Welcome to CloudLocker"}


app.include_router(health.router)
app.include_router(lockers.router)
app.include_router(users.router)
app.include_router(reservation_router)
app.include_router(access_log_router)
