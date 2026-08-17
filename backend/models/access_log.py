from sqlalchemy import Column, Integer, DateTime, String, ForeignKey
from sqlalchemy.sql import func

from .locker import Base


class AccessLog(Base):
    __tablename__ = "access_logs"

    log_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.user_id"))

    locker_id = Column(Integer, ForeignKey("lockers.locker_id"), nullable=True)

    door_id = Column(Integer, ForeignKey("doors.door_id"), nullable=True)

    access_time = Column(DateTime, server_default=func.now())

    action = Column(String(20))