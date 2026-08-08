from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
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
