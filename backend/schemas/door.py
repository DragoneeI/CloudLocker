from pydantic import BaseModel
from datetime import datetime


class DoorCreate(BaseModel):
    door_name: str


class DoorResponse(BaseModel):
    door_id: int
    door_name: str
    status: str
    is_open: bool

    model_config = {
        "from_attributes": True
    }


class DoorStatusUpdate(BaseModel):
    status: str


class DoorPermissionGrant(BaseModel):
    user_id: int
    door_id: int


class DoorPermissionResponse(BaseModel):
    permission_id: int
    user_id: int
    door_id: int
    granted_at: datetime

    model_config = {
        "from_attributes": True
    }