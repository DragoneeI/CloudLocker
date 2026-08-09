from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Locker, Reservation
from backend.schemas import UserCreate, UserResponse
from backend.services import rekognition_service

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

@router.get("/{user_id}/locker")
def get_user_locker(
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
            "user_id": user_id,
            "locker": None
        }

    locker = (
        db.query(Locker)
        .filter(Locker.locker_id == reservation.locker_id)
        .first()
    )

    return {
        "user_id": user_id,
        "locker": {
            "locker_id": locker.locker_id,
            "locker_name": locker.locker_name,
            "status": locker.status,
            "reservation_id": reservation.reservation_id,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time
        }
    }

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    # 1. Find user
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

    # 2. Don't delete a user with an active reservation
    active_reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "Active"
        )
        .first()
    )

    if active_reservation:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete user with an active reservation"
        )

    # 3. Remove face from Rekognition
    if user.face_image:
        try:
            rekognition_service.delete_user_face(
                user.face_image
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete face: {str(e)}"
            )

    # 4. Delete user from database
    db.delete(user)
    db.commit()

    return {
        "status": "deleted",
        "user_id": user_id
    }

@router.patch("/{user_id}/deactivate")
def deactivate_user(
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

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User is already inactive"
        )

    active_reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "Active"
        )
        .first()
    )

    if active_reservation:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate user with an active reservation"
        )

    user.is_active = False
    db.commit()

    return {
        "status": "deactivated",
        "user_id": user_id
    }

@router.patch("/{user_id}/activate")
def activate_user(
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

    if  user.is_active:
        raise HTTPException(
            status_code=400,
            detail="User is already active"
        )

    active_reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "deactivated"
        )
        .first()
    )

    user.is_active = True
    db.commit()

    return {
        "status": "Active",
        "user_id": user_id
    }
