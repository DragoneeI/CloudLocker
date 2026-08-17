from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services import rekognition_service
from backend.models.door import Door
from backend.models.door_permission import DoorPermission
from backend.models.user import User
from backend.models.access_log import AccessLog
from backend.schemas import (
    DoorCreate,
    DoorResponse,
    DoorStatusUpdate,
    DoorPermissionGrant,
    DoorPermissionResponse
)

router = APIRouter(prefix="/doors", tags=["Doors"])


@router.post("", response_model=DoorResponse)
def create_door(door: DoorCreate, db: Session = Depends(get_db)):
    new_door = Door(door_name=door.door_name)

    db.add(new_door)
    db.commit()
    db.refresh(new_door)

    return new_door


@router.get("", response_model=list[DoorResponse])
def get_doors(db: Session = Depends(get_db)):
    return db.query(Door).order_by(Door.door_id).all()


@router.get("/{door_id}")
def get_door_details(door_id: int, db: Session = Depends(get_db)):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    permissions = (
        db.query(DoorPermission)
        .filter(DoorPermission.door_id == door_id)
        .all()
    )

    users = []
    for perm in permissions:
        user = db.query(User).filter(User.user_id == perm.user_id).first()
        if user:
            users.append({
                "user_id": user.user_id,
                "full_name": user.full_name,
                "email": user.email,
                "granted_at": perm.granted_at
            })

    return {
        "door_id": door.door_id,
        "door_name": door.door_name,
        "status": door.status,
        "is_open": door.is_open,
        "authorized_users": users
    }


@router.patch("/{door_id}/status")
def update_door_status(
    door_id: int,
    data: DoorStatusUpdate,
    db: Session = Depends(get_db)
):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    allowed_statuses = ["Online", "Offline"]

    if data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid door status")

    door.status = data.status

    db.commit()
    db.refresh(door)

    return door


@router.delete("/{door_id}")
def delete_door(door_id: int, db: Session = Depends(get_db)):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    db.delete(door)
    db.commit()

    return {"status": "deleted", "door_id": door_id}


# ==================================================
# PERMISSIONS
# ==================================================

@router.post("/permissions/grant", response_model=DoorPermissionResponse)
def grant_permission(
    data: DoorPermissionGrant,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    door = db.query(Door).filter(Door.door_id == data.door_id).first()
    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    existing = (
        db.query(DoorPermission)
        .filter(
            DoorPermission.user_id == data.user_id,
            DoorPermission.door_id == data.door_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already has access to this door"
        )

    permission = DoorPermission(
        user_id=data.user_id,
        door_id=data.door_id
    )

    db.add(permission)
    db.commit()
    db.refresh(permission)

    return permission


@router.delete("/permissions/revoke")
def revoke_permission(
    user_id: int,
    door_id: int,
    db: Session = Depends(get_db)
):
    permission = (
        db.query(DoorPermission)
        .filter(
            DoorPermission.user_id == user_id,
            DoorPermission.door_id == door_id
        )
        .first()
    )

    if not permission:
        raise HTTPException(
            status_code=404,
            detail="Permission not found"
        )

    db.delete(permission)
    db.commit()

    return {"status": "revoked", "user_id": user_id, "door_id": door_id}


@router.get("/permissions/user/{user_id}", response_model=list[DoorPermissionResponse])
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(DoorPermission)
        .filter(DoorPermission.user_id == user_id)
        .all()
    )


# ==================================================
# OPEN / CLOSE
# ==================================================

@router.post("/{door_id}/open")
def open_door(door_id: int, db: Session = Depends(get_db)):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    if door.status != "Online":
        raise HTTPException(status_code=400, detail="Door is offline")

    door.is_open = True
    db.commit()
    db.refresh(door)

    return {
        "status": "opened",
        "door_id": door.door_id,
        "door_name": door.door_name
    }


@router.post("/{door_id}/close")
def close_door(door_id: int, db: Session = Depends(get_db)):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    door.is_open = False
    db.commit()
    db.refresh(door)

    return {
        "status": "closed",
        "door_id": door.door_id,
        "door_name": door.door_name
    }

@router.post("/{door_id}/access")
async def door_access(
    door_id: int,
    image: UploadFile,
    db: Session = Depends(get_db)
):
    door = db.query(Door).filter(Door.door_id == door_id).first()

    if not door:
        raise HTTPException(status_code=404, detail="Door not found")

    image_bytes = await image.read()

    # 1. Identify the user
    result = rekognition_service.identify_user(image_bytes)

    if result["status"] == "no_face_detected":
        raise HTTPException(status_code=400, detail="No face detected")

    if result["status"] == "unknown":
        return {
            "status": "unknown",
            "message": "Unknown User"
        }

    user_id = int(result["user_id"])

    user = db.query(User).filter(User.user_id == user_id).first()

    if not user or not user.is_active:
        return {
            "status": "inactive",
            "message": "User account is inactive"
        }

    # 2. Check door status
    if door.status != "Online":
        return {
            "status": "door_offline",
            "user_id": user_id,
            "message": "This door is currently offline"
        }

    # 3. Check permission
    permission = (
        db.query(DoorPermission)
        .filter(
            DoorPermission.user_id == user_id,
            DoorPermission.door_id == door_id
        )
        .first()
    )

    if not permission:
        return {
            "status": "unauthorized",
            "user_id": user_id,
            "message": "You do not have access to this door"
        }

    return {
        "status": "match",
        "user_id": user_id,
        "similarity": result["similarity"],
        "door": {
            "door_id": door.door_id,
            "door_name": door.door_name,
            "status": door.status,
            "is_open": door.is_open
        }
    }
