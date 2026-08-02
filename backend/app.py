from fastapi import FastAPI

from backend.routers import health
from backend.routers import lockers
from backend.routers import users

app = FastAPI(title="CloudLocker API")


@app.get("/")
def home():
    return {"message": "Welcome to CloudLocker"}


app.include_router(health.router)
app.include_router(lockers.router)
app.include_router(users.router)
