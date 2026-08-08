from pydantic import BaseModel


class LockerStatusUpdate(BaseModel):
    status: str
