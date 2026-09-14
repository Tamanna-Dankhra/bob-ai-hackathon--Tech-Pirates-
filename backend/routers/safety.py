"""
Safety Intelligence Router
===========================
Handles CSV upload and adverse-event signal detection.
"""

from __future__ import annotations

import io
from typing import Any

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File

from services.prr_calculator import calculate_prr

router = APIRouter()

REQUIRED_COLUMNS = {"drug_name", "adverse_event", "report_count"}


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
