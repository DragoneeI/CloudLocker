from sqlalchemy import Column, Integer, DateTime, String, ForeignKey
from .locker import Base


class Reservation(Base):
    __tablename__ = "reservations"

    reservation_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    locker_id = Column(Integer, ForeignKey("lockers.locker_id"), nullable=False)

    start_time = Column(DateTime)

    end_time = Column(DateTime)

    status = Column(String(20), default="Active")
