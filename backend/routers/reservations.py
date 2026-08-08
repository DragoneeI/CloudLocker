from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import ReservationCreate, ReservationResponse, AutoReservationCreate
from backend.services.reservation_service import (
    assign_specific_locker, 
    assign_first_available_locker,
    expire_reservations
)

router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"]
)


@router.post(
    "/manual",
    response_model=ReservationResponse
)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db)
):
    return assign_specific_locker(
        db=db,
        user_id=reservation.user_id,
        locker_id=reservation.locker_id,
        start_time=reservation.start_time,
        end_time=reservation.end_time
    )

@router.post(
    "/auto",
    response_model=ReservationResponse
)
def create_auto_reservation(
    reservation: AutoReservationCreate,
    db: Session = Depends(get_db)
):
    return assign_first_available_locker(
        db=db,
        user_id=reservation.user_id,
        start_time=reservation.start_time,
        end_time=reservation.end_time
    )

@router.post("/expire")
def expire_reservations_endpoint(
    db: Session = Depends(get_db)
):
    count = expire_reservations(db)

    return {
        "message": f"{count} reservation(s) expired"
    }
