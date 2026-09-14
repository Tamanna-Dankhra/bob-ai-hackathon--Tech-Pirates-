"""
PharmaGuard AI - Backend Entry Point
=====================================
FastAPI application for Drug Safety Signal Detection
and Regulatory Submission Readiness Checking.
"""

# Load .env file if present (before any other imports read os.environ)
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import safety, regulatory, copilot
from services.watsonx_client import get_watsonx_config_status

app = FastAPI(
    title="PharmaGuard AI",
    description=(
        "Drug Safety Signal Detector & Regulatory Submission Readiness Checker. "
        "IBM Bob AI Hackathon - Problem Statement P2."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend (any origin during development)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(safety.router, prefix="/api/safety", tags=["Safety Intelligence"])
app.include_router(regulatory.router, prefix="/api/regulatory", tags=["Regulatory Intelligence"])
app.include_router(copilot.router, prefix="/api/copilot", tags=["AI Copilot"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
def health_check():
    """Confirms the PharmaGuard AI backend is running and returns watsonx config status."""
    return {
        "status": "ok",
        "service": "PharmaGuard AI",
        "message": "PharmaGuard AI backend is running.",
        "watsonx": get_watsonx_config_status(),
    }
