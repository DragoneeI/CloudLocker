from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Locker, Reservation
from backend.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("")
def create_user(user: UserCreate, db: Session = Depends(get_db)):

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        face_image=user.face_image,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/{user_id}")
def get_user_details(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "Active"
        )
        .first()
    )

    if not reservation:
        return {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "face_image": user.face_image,
            "reservation": None
        }

    locker = (
        db.query(Locker)
        .filter(Locker.locker_id == reservation.locker_id)
        .first()
    )

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "face_image": user.face_image,
        "reservation": {
            "reservation_id": reservation.reservation_id,
            "locker_id": locker.locker_id,
            "locker_name": locker.locker_name,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time,
            "status": reservation.status
        }
    }
