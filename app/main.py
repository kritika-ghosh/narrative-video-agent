from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .api import routes

app = FastAPI(
    title="Narrative Archivist API",
    description="AI Agent for converting images and text into curated video narratives.",
    version="1.0.0"
)

# 1. ALLOW CROSS-ORIGIN REQUESTS FROM YOUR FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, you can replace "*" with your actual Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. ENSURE LOCAL VIDEO DIRECTORIES EXIST AT RUNTIME
# This prevents crashes on Hugging Face if the container resets
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("data/outputs", exist_ok=True)

# 3. SERVE GENERATED VIDEOS
app.mount("/data", StaticFiles(directory="data"), name="data")

# 4. ROUTE INCLUSION
app.include_router(routes.router, prefix="/api/v1")

# 5. HEALTH ENDPOINT FOR UPTIMEROBOT
# To this (allow both GET and HEAD verbs):
@app.get("/health")
@app.head("/health")
async def health_check():
    """Simple health check endpoint for keeping the space awake."""
    return {"status": "online", "message": "Narrative Archivist is awake and listening."}