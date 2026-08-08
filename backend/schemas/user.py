from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    face_image: str | None = None

class UserResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    face_image: str | None = None

    model_config = {
        "from_attributes": True
    }
