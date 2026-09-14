"""
Regulatory Intelligence Router
================================
Checks a pharmaceutical dossier against ICH M4 CTD requirements.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.ctd_checker import check_submission

router = APIRouter()


class SubmissionCheckRequest(BaseModel):
    submitted_sections: list[str] = Field(
        default=[],
        description="List of section IDs that have been fully submitted (e.g. ['1.1', '2.3']).",
        examples=[["1.1", "2.3", "3.2.P.1"]],
    )
    incomplete_sections: list[str] = Field(
        default=[],
        description="List of section IDs that have been partially submitted.",
        examples=[["2.5"]],
    )


@router.post("/check")
def check_regulatory_submission(body: SubmissionCheckRequest) -> dict[str, Any]:
    """
    Check a pharmaceutical submission against ICH M4 CTD requirements.

    Returns readiness percentage, per-section status, and a prioritized gap report.
    """
    result = check_submission(
        submitted_sections=body.submitted_sections,
        incomplete_sections=body.incomplete_sections,
    )
    return result
