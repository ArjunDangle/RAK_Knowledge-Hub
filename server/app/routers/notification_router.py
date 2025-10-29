# server/app/routers/notification_router.py
import asyncio
import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sse_starlette.sse import EventSourceResponse
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db import db
from app.schemas import auth_schemas
from app.routers.auth_router import get_current_user
from app.broadcaster import broadcast

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    message: str
    link: Optional[str] = None
    isRead: bool
    createdAt: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    notifications = await db.notification.find_many(
        where={'recipientId': current_user.id},
        order={'createdAt': 'desc'},
        take=20
    )
    return notifications

@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(notification_id: int, current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    notification = await db.notification.find_first(where={'id': notification_id, 'recipientId': current_user.id})
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    await db.notification.update(
        where={'id': notification_id},
        data={'isRead': True}
    )
    return

@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_as_read(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    await db.notification.update_many(
        where={'recipientId': current_user.id, 'isRead': False},
        data={'isRead': True}
    )
    return

@router.get("/stream")
async def stream_notifications(request: Request, current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    
    async def event_generator():
        q = await broadcast.subscribe(current_user.id)
        try:
            while True:
                if await request.is_disconnected():
                    break
                
                message = await q.get()
                yield {
                    "event": "new_notification",
                    "data": message
                }
        finally:
            broadcast.unsubscribe(current_user.id, q)

    return EventSourceResponse(event_generator())