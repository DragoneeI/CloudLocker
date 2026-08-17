from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from .locker import Base


class DoorPermission(Base):
    __tablename__ = "door_permissions"

    permission_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    door_id = Column(Integer, ForeignKey("doors.door_id"), nullable=False)

    granted_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "door_id", name="uq_user_door"),
    )