from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import routes

app = FastAPI(
    title="Narrative Archivist API",
    description="AI Agent for converting images and text into curated video narratives.",
    version="1.0.0"
)

# Allow frontend applications to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our API routes
app.include_router(routes.router, prefix="/api/v1")

@app.get("/")
async def health_check():
    """Simple health check to verify the server is running."""
    return {"status": "online", "message": "Narrative Archivist is awake and ready."}