from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate

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
