from datetime import datetime

from pydantic import BaseModel


class ReservationCreate(BaseModel):
    user_id: int
    locker_id: int
    start_time: datetime
    end_time: datetime


class ReservationResponse(BaseModel):
    reservation_id: int
    user_id: int
    locker_id: int
    start_time: datetime
    end_time: datetime
    status: str

    model_config = {
        "from_attributes": True
    }

class AutoReservationCreate(BaseModel):
    user_id: int
    start_time: datetime
    end_time: datetime
