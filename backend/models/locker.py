from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Locker(Base):
    __tablename__ = "lockers"

    locker_id = Column(Integer, primary_key=True, index=True)
    locker_name = Column(String)
    status = Column(String)
