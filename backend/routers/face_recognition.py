from fastapi import APIRouter, UploadFile, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from services import rekognition_service
import crud

router = APIRouter(prefix="/face", tags=["face-recognition"])


@router.post("/enroll/{user_id}")
def enroll_face(user_id: int, s3_key: str, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        face_id = rekognition_service.enroll_user_face(
            bucket="your-bucket-name",  # or settings.S3_BUCKET_NAME
            s3_key=s3_key,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    crud.update_user_face_id(db, user_id, face_id)
    return {"status": "enrolled", "face_id": face_id}


@router.post("/verify")
async def verify_face(image: UploadFile):
    image_bytes = await image.read()
    result = rekognition_service.identify_user(image_bytes)

    if result["status"] == "no_face_detected":
        raise HTTPException(status_code=400, detail="No face detected in captured image")
    if result["status"] == "unknown":
        return {"status": "unknown", "message": "Unknown User"}

    return result


@router.delete("/enroll/{user_id}")
def unenroll_face(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user or not user.face_id:
        raise HTTPException(status_code=404, detail="No enrolled face for this user")

    rekognition_service.delete_user_face(user.face_id)
    crud.update_user_face_id(db, user_id, None)
    return {"status": "deleted"}
