from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Locker

router = APIRouter(prefix="/lockers", tags=["Lockers"])


@router.get("")
def get_lockers(db: Session = Depends(get_db)):
    return db.query(Locker).all()
