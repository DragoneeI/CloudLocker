from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import AccessLog
from backend.schemas import AccessLogResponse

router = APIRouter(
    prefix="/access-logs",
    tags=["Access Logs"]
)


@router.get(
    "/",
    response_model=list[AccessLogResponse]
)
def get_access_logs(db: Session = Depends(get_db)):
    return (
        db.query(AccessLog)
        .order_by(AccessLog.access_time.desc())
        .all()
    )
