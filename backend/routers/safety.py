"""
Safety Intelligence Router
===========================
Handles CSV upload and adverse-event signal detection.
"""

from __future__ import annotations

import io
import os
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File

from services.prr_calculator import calculate_prr

router = APIRouter()

REQUIRED_COLUMNS = {"drug_name", "adverse_event", "report_count"}

# Path to the bundled demo dataset (relative to this file)
_DEMO_CSV_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "sample_adverse_events.csv"
)


def _validate_csv(df: pd.DataFrame) -> None:
    """Raise HTTPException with a descriptive message if the CSV is invalid."""
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=(
                f"CSV is missing required column(s): {', '.join(sorted(missing))}. "
                f"Expected columns: drug_name, adverse_event, report_count."
            ),
        )

    if df.empty:
        raise HTTPException(status_code=422, detail="CSV file contains no data rows.")

    # Validate report_count is numeric
    try:
        df["report_count"] = pd.to_numeric(df["report_count"], errors="raise")
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="Column 'report_count' must contain numeric values only.",
        )

    negative = (df["report_count"] < 0).sum()
    if negative > 0:
        raise HTTPException(
            status_code=422,
            detail=f"Column 'report_count' contains {negative} negative value(s). Counts must be >= 0.",
        )


def _analyze_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """
    Shared analysis logic used by both the upload endpoint and the demo endpoint.
    Runs validation, PRR calculation, and returns the standard response dict.
    """
    # Strip whitespace from column names and string values
    df.columns = df.columns.str.strip()
    for col in ["drug_name", "adverse_event"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    _validate_csv(df)

    signals = calculate_prr(df)

    return {
        "summary": {
            "total_reports": int(df["report_count"].sum()),
            "num_drugs": int(df["drug_name"].nunique()),
            "num_adverse_events": int(df["adverse_event"].nunique()),
            "num_potential_signals": len(signals),
        },
        "signals": signals,
        "disclaimer": (
            "All signals listed are *potential* safety signals only. "
            "This tool does not establish causation between a drug and an adverse event. "
            "Results require expert pharmacovigilance review."
        ),
    }


@router.get("/demo")
def analyze_demo() -> dict[str, Any]:
    """
    Run safety signal analysis on the bundled synthetic demo dataset.

    Uses the exact same PRR calculation and validation as the CSV upload endpoint.
    The dataset is clearly marked as synthetic/demo — not real patient data.
    """
    try:
        df = pd.read_csv(_DEMO_CSV_PATH, comment="#")
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="Demo dataset not found on the server.",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load demo dataset: {exc}",
        )

    result = _analyze_dataframe(df)
    result["demo"] = True
    result["demo_note"] = (
        "This analysis used the built-in synthetic demo dataset "
        "(backend/data/sample_adverse_events.csv). "
        "It does NOT represent real patients, drugs, or adverse events."
    )
    return result


@router.post("/analyze")
async def analyze_safety(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Upload a CSV file of adverse-event reports and detect potential safety signals.

    Expected CSV columns: drug_name, adverse_event, report_count
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=422,
            detail="Only CSV files are accepted. Please upload a .csv file.",
        )

    content = await file.read()

    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")), comment="#")
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not parse CSV file: {exc}",
        )

    return _analyze_dataframe(df)
