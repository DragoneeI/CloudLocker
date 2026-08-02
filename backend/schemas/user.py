from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    face_image: str | None = None
