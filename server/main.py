# main.py
import os
from fastapi import FastAPI
from routers import knowledge_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Knowledge Hub API",
    description="Fetches and transforms data from Confluence.",
    version="1.0.0"
)

# --- CORRECTED CORS MIDDLEWARE SECTION ---
# This allows your React app (running on localhost:8080) to talk to your API
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

FRONTEND_URL = os.environ.get("FRONTEND_URL")
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------

app.include_router(knowledge_router.router)

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Knowledge Hub API is running!"}