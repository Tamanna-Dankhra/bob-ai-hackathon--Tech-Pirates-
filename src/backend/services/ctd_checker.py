"""
CTD Checker - ICH M4 CTD Submission Readiness
===============================================
Deterministic engine that checks a pharmaceutical dossier
against ICH M4 Common Technical Document (CTD) requirements.

Reference: ICH M4 Guideline on Common Technical Document (CTD)
           https://www.ich.org/page/ctd
"""

from __future__ import annotations

import json
import os
from typing import Any

# Path to the CTD requirements JSON (relative to this file)
_REQUIREMENTS_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "ctd_requirements.json"
)

# Status constants
STATUS_COMPLETE = "COMPLETE"
STATUS_INCOMPLETE = "INCOMPLETE"
STATUS_MISSING = "MISSING"

# Priority ordering for sorting gaps
_PRIORITY_ORDER = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}


def _load_requirements() -> list[dict[str, str]]:
    """Load CTD requirements from the JSON file."""
    with open(_REQUIREMENTS_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def check_submission(
    submitted_sections: list[str],
    incomplete_sections: list[str],
) -> dict[str, Any]:
    """
    Check submitted and incomplete sections against all CTD requirements.

    Parameters
    ----------
    submitted_sections  : Section IDs the applicant has fully submitted.
    incomplete_sections : Section IDs the applicant has partially submitted.

    Returns
    -------
    dict with readiness_percentage, counts, section_statuses, and prioritized_gaps.
    """
    requirements = _load_requirements()
    total = len(requirements)

    submitted_set = {s.strip() for s in submitted_sections}
    incomplete_set = {s.strip() for s in incomplete_sections}

    section_statuses: list[dict[str, str]] = []
    gaps: list[dict[str, str]] = []
    complete_count = 0

    for req in requirements:
        section = req["section"]

        if section in submitted_set:
            status = STATUS_COMPLETE
            complete_count += 1
        elif section in incomplete_set:
            status = STATUS_INCOMPLETE
        else:
            status = STATUS_MISSING

        entry = {
            "section": section,
            "title": req["title"],
            "module": req["module"],
            "priority": req["priority"],
            "status": status,
        }
        section_statuses.append(entry)

        if status != STATUS_COMPLETE:
            gaps.append(
                {
                    "section": section,
                    "title": req["title"],
                    "module": req["module"],
                    "priority": req["priority"],
                    "status": status,
                    "action": (
                        f"Complete and submit section {section}: {req['title']}."
                        if status == STATUS_MISSING
                        else f"Finalise incomplete section {section}: {req['title']}."
                    ),
                }
            )

    incomplete_count = sum(1 for s in section_statuses if s["status"] == STATUS_INCOMPLETE)
    missing_count = sum(1 for s in section_statuses if s["status"] == STATUS_MISSING)

    readiness_percentage = round((complete_count / total) * 100, 1) if total > 0 else 0.0

    # Sort gaps: HIGH → MEDIUM → LOW, then MISSING before INCOMPLETE
    status_order = {STATUS_MISSING: 0, STATUS_INCOMPLETE: 1}
    gaps.sort(
        key=lambda g: (
            _PRIORITY_ORDER.get(g["priority"], 9),
            status_order.get(g["status"], 9),
        )
    )

    return {
        "readiness_percentage": readiness_percentage,
        "complete_count": complete_count,
        "incomplete_count": incomplete_count,
        "missing_count": missing_count,
        "total_requirements": total,
        "section_statuses": section_statuses,
        "prioritized_gaps": gaps,
    }
