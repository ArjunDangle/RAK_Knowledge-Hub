# server/app/main.py
import os
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import db
from app.routers import knowledge_router, auth_router, cms_router, notification_router, group_router

app = FastAPI(
    title="Knowledge Hub API",
    description="Fetches and transforms data from Confluence.",
    version="1.0.0"
)

# --- Background Task ---
async def cleanup_old_notifications():
    """
    A background task that runs every hour to delete notifications
    older than 24 hours from the database.
    """
    while True:
        try:
            # Wait for 1 hour
            await asyncio.sleep(3600) 
            
            print(f"[{datetime.now()}] Running notification cleanup task...")
            twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
            
            deleted_count = await db.notification.delete_many(
                where={
                    'createdAt': {
                        'lt': twenty_four_hours_ago
                    }
                }
            )
            if deleted_count > 0:
                print(f"Cleaned up {deleted_count} old notifications.")
            else:
                print("No old notifications to clean up.")
                
        except Exception as e:
            # Catch exceptions so the loop doesn't break
            print(f"Error during notification cleanup: {e}")

@app.on_event("startup")
async def startup():
    await db.connect()
    asyncio.create_task(cleanup_old_notifications())

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://rak-knowledge-hub.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge_router.router)
app.include_router(auth_router.router, prefix="/auth")
app.include_router(cms_router.router)
app.include_router(notification_router.router)
# --- THIS LINE IS UPDATED ---
app.include_router(group_router.router, prefix="/api/groups")


@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Knowledge Hub API is running!"}