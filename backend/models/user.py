from sqlalchemy import Column, Integer, String, Boolean
from .locker import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    face_image = Column(String)
    is_active = Column(Boolean, nullable=False, default=True)
