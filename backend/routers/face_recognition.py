from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Locker, Reservation
from backend.services import rekognition_service

router = APIRouter(
    prefix="/face",
    tags=["Face Recognition"]
)


@router.post("/enroll/{user_id}")
async def enroll_face(
    user_id: int,
    image: UploadFile,
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

    image_bytes = await image.read()

    try:
        face_id = rekognition_service.enroll_user_face(
            image_bytes,
            user_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    user.face_image = face_id

    db.commit()

    return {
        "status": "enrolled",
        "user_id": user_id,
        "face_id": face_id
    }

@router.delete("/enroll/{user_id}")
def unenroll_face(
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

    if not user.face_image:
        raise HTTPException(
            status_code=404,
            detail="User has no enrolled face"
        )

    try:
        rekognition_service.delete_user_face(
            user.face_image
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    user.face_image = None

    db.commit()

    return {
        "status": "deleted",
        "user_id": user_id
    }

@router.post("/verify")
async def verify_face(image: UploadFile):

    image_bytes = await image.read()

    result = rekognition_service.identify_user(image_bytes)

    if result["status"] == "no_face_detected":
        raise HTTPException(
            status_code=400,
            detail="No face detected in captured image"
        )

    if result["status"] == "unknown":
        return {
            "status": "unknown",
            "message": "Unknown User"
        }

    return result

@router.post("/access")
async def face_access(
    image: UploadFile,
    db: Session = Depends(get_db)
):
    image_bytes = await image.read()

    # 1. Identify the user
    result = rekognition_service.identify_user(image_bytes)

    if result["status"] == "no_face_detected":
        raise HTTPException(
            status_code=400,
            detail="No face detected"
        )

    if result["status"] == "unknown":
        return {
            "status": "unknown",
            "message": "Unknown User"
        }

    user_id = int(result["user_id"])

    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if not user or not user.is_active:
        return {
            "status": "inactive",
            "message": "User account is inactive"
        }

    # 2. Find the user's active reservation
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
            "status": "no_reservation",
            "user_id": user_id,
            "message": "User has no active locker reservation"
        }

    # 3. Find the locker
    locker = (
        db.query(Locker)
        .filter(Locker.locker_id == reservation.locker_id)
        .first()
    )

    return {
        "status": "match",
        "user_id": user_id,
        "similarity": result["similarity"],
        "locker": {
            "locker_id": locker.locker_id,
            "locker_name": locker.locker_name,
            "status": locker.status,
            "reservation_id": reservation.reservation_id,
            "start_time": reservation.start_time,
            "end_time": reservation.end_time
        }
    }
