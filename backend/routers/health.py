from fastapi import APIRouter
from backend.database import engine

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    with engine.connect():
        return {"database": "Connected"}
