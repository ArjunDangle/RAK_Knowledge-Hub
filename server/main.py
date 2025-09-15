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
# This allows all origins, which is standard for development to solve issues
# like the one you are facing with the iframe.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------

app.include_router(knowledge_router.router)

# ADD THESE THREE LINES:
@app.get("/test-cors", tags=["Health Check"])
def test_cors_endpoint():
    return {"message": "CORS test successful!"}

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Knowledge Hub API is running!"}

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "Knowledge Hub API is running!"}