from sqlalchemy import Column, Integer, String, Boolean
from .locker import Base


class Door(Base):
    __tablename__ = "doors"

    door_id = Column(Integer, primary_key=True, index=True)
    door_name = Column(String(20), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="Online")
    is_open = Column(Boolean, default=False, nullable=False)