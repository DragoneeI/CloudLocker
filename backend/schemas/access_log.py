from datetime import datetime
from pydantic import BaseModel


class AccessLogResponse(BaseModel):
    log_id: int
    user_id: int | None = None
    locker_id: int | None = None
    door_id: int | None = None
    access_time: datetime
    action: str

    model_config = {
        "from_attributes": True
    }
