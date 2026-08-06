from datetime import datetime
from pydantic import BaseModel


class AccessLogResponse(BaseModel):
    log_id: int
    user_id: int
    locker_id: int
    access_time: datetime
    action: str

    model_config = {
        "from_attributes": True
    }
