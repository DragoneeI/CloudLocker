from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import User, Locker, Reservation


def get_user(db: Session, user_id: int):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def get_locker(db: Session, locker_id: int):
    locker = db.query(Locker).filter(Locker.locker_id == locker_id).first()

    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    return locker


def has_active_reservation(db: Session, user_id: int):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "Active"
        )
        .first()
    )

    return reservation is not None
