from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Locker, Reservation, User
from backend.services.reservation_service import release_locker
from backend.schemas import LockerStatusUpdate

router = APIRouter(prefix="/lockers", tags=["Lockers"])


@router.get("")
def get_lockers(db: Session = Depends(get_db)):
    return (
        db.query(Locker)
        .order_by(Locker.locker_id)
        .all()
    )

@router.get("/{locker_id}")
def get_locker_details(
    locker_id: int,
    db: Session = Depends(get_db)
):
    locker = (
        db.query(Locker)
        .filter(Locker.locker_id == locker_id)
        .first()
    )

    if not locker:
        return {"detail": "Locker not found"}

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.locker_id == locker_id,
            Reservation.status == "Active"
        )
        .first()
    )

    if not reservation:
        return {
            "locker_id": locker.locker_id,
            "locker_name": locker.locker_name,
            "status": locker.status,
            "user": None,
            "reservation": None
        }

    user = (
        db.query(User)
        .filter(User.user_id == reservation.user_id)
        .first()
    )

    return {
        "locker_id": locker.locker_id,
        "locker_name": locker.locker_name,
        "status": locker.status,
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email
        },
        "reservation": {
            "reservation_id": reservation.reservation_id,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time,
            "status": reservation.status
        }
    }

@router.patch("/{locker_id}/status")
def update_locker_status(
    locker_id: int,
    data: LockerStatusUpdate,
    db: Session = Depends(get_db)
):
    locker = (
        db.query(Locker)
        .filter(Locker.locker_id == locker_id)
        .first()
    )

    if not locker:
        raise HTTPException(
            status_code=404,
            detail="Locker not found"
        )

    allowed_statuses = ["Available", "Reserved", "Offline"]

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid locker status"
        )

    locker.status = data.status

    db.commit()
    db.refresh(locker)

    return locker

@router.post("/{locker_id}/release")
def release_locker_endpoint(
    locker_id: int,
    db: Session = Depends(get_db)
):
    return release_locker(db, locker_id)
