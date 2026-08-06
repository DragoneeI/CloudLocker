from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.models import User, Locker, Reservation, AccessLog


def get_user(db: Session, user_id: int):
    user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def get_locker(db: Session, locker_id: int):
    locker = db.query(Locker).filter(Locker.locker_id == locker_id).first()

    if not locker:
        raise HTTPException(status_code=404, detail="Locker not found")

    return locker


def has_active_reservation(db: Session, user_id: int):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user_id,
            Reservation.status == "Active"
        )
        .first()
    )

    return reservation is not None

def assign_specific_locker(db: Session, user_id: int, locker_id: int, start_time, end_time):

    get_user(db, user_id)

    locker = get_locker(db, locker_id)

    if locker.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Locker is not available"
        )

    if has_active_reservation(db, user_id):
        raise HTTPException(
            status_code=400,
            detail="User already has an active reservation"
        )

    reservation = Reservation(
        user_id=user_id,
        locker_id=locker_id,
        start_time=start_time,
        end_time=end_time,
        status="Active"
    )

    db.add(reservation)

    locker.status = "Reserved"

    log = AccessLog(
        user_id=user_id,
        locker_id=locker_id,
        action="Reserved"
    )

    db.add(log)

    db.commit()
    db.refresh(reservation)

    return reservation

def assign_first_available_locker(db: Session, user_id: int, start_time, end_time):

    get_user(db, user_id)

    if has_active_reservation(db, user_id):
        raise HTTPException(
            status_code=400,
            detail="User already has an active reservation"
        )

    locker = (
        db.query(Locker)
        .filter(Locker.status == "Available")
        .order_by(Locker.locker_id)
        .first()
    )

    if not locker:
        raise HTTPException(
            status_code=400,
            detail="No available lockers"
        )

    reservation = Reservation(
        user_id=user_id,
        locker_id=locker.locker_id,
        start_time=start_time,
        end_time=end_time,
        status="Active"
    )

    db.add(reservation)

    locker.status = "Reserved"

    log = AccessLog(
        user_id=user_id,
        locker_id=locker.locker_id,
        action="Reserved"
    )

    db.add(log)

    db.commit()
    db.refresh(reservation)

    return reservation

def finish_reservation(db: Session, reservation_id: int):

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.reservation_id == reservation_id,
            Reservation.status == "Active"
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Active reservation not found"
        )

    locker = get_locker(db, reservation.locker_id)

    reservation.status = "Finished"
    locker.status = "Available"

    log = AccessLog(
        user_id=reservation.user_id,
        locker_id=reservation.locker_id,
        action="Released"
    )

    db.add(log)

    db.commit()

    return {"message": "Locker released successfully"}
