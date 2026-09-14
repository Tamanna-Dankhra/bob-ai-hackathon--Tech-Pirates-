"""
PRR Calculator - Proportional Reporting Ratio
===============================================
Calculates PRR for drug + adverse-event combinations
to detect potential pharmacovigilance safety signals.

DISCLAIMER:
All outputs describe *potential safety signals* only.
No causal relationship between a drug and an adverse event
is implied or should be inferred from these calculations.
"""

from __future__ import annotations

import math
from typing import Any

import pandas as pd


# ---------------------------------------------------------------------------
# Signal threshold constants
# ---------------------------------------------------------------------------
PRR_SIGNAL_THRESHOLD = 2.0      # PRR must be >= 2 to qualify
MIN_REPORT_COUNT = 3            # At least 3 reports required

PRR_HIGH_THRESHOLD = 5.0        # HIGH priority
PRR_MEDIUM_THRESHOLD = 2.0      # MEDIUM priority


def _safe_divide(numerator: float, denominator: float) -> float:
    """Divide safely; return 0.0 when the denominator is zero."""
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _priority(prr: float) -> str:
    if prr >= PRR_HIGH_THRESHOLD:
        return "HIGH"
    if prr >= PRR_MEDIUM_THRESHOLD:
        return "MEDIUM"
    return "LOW"


def _explanation(drug: str, adverse_event: str, prr: float, report_count: int, priority: str) -> str:
    """
    Generate a plain-English explanation suitable for a non-technical user.
    Language deliberately avoids causal claims.
    """
    priority_text = {
        "HIGH": (
            f"This is a HIGH-priority potential signal. "
            f"Reports of '{adverse_event}' appear {prr:.1f}x more frequently "
            f"for '{drug}' than for other drugs in this dataset. "
            f"With {report_count} reports, this pattern warrants prompt investigation."
        ),
        "MEDIUM": (
            f"This is a MEDIUM-priority potential signal. "
            f"Reports of '{adverse_event}' appear {prr:.1f}x more frequently "
            f"for '{drug}' than for other drugs in this dataset "
            f"({report_count} reports). This combination should be reviewed."
        ),
        "LOW": (
            f"This is a LOW-priority potential signal. "
            f"'{adverse_event}' is reported slightly more often for '{drug}' "
            f"than expected based on the overall dataset ({report_count} reports, "
            f"PRR {prr:.2f}). Routine monitoring is recommended."
        ),
    }
    return priority_text.get(priority, "No explanation available.")


def calculate_prr(df: pd.DataFrame) -> list[dict[str, Any]]:
    """
    Calculate PRR for every drug + adverse-event combination in *df*.

    Expected columns
    ----------------
    drug_name      : str
    adverse_event  : str
    report_count   : int

    Returns
    -------
    List of potential signal dicts (only combinations meeting the signal
    threshold are included).
    """
    # Aggregate duplicate rows (same drug + event from multiple rows)
    df = (
        df.groupby(["drug_name", "adverse_event"], as_index=False)["report_count"]
        .sum()
    )

    total_reports = df["report_count"].sum()

    signals: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        drug = row["drug_name"]
        event = row["adverse_event"]

        # a: reports for selected drug + selected event
        a = row["report_count"]

        # b: reports for selected drug + all OTHER events
        drug_total = df[df["drug_name"] == drug]["report_count"].sum()
        b = drug_total - a

        # c: reports for all other drugs + selected event
        event_total = df[df["adverse_event"] == event]["report_count"].sum()
        c = event_total - a

        # d: reports for all other drugs + all other events
        d = total_reports - a - b - c

        # PRR = (a / (a+b)) / (c / (c+d))
        numerator = _safe_divide(a, a + b)
        denominator = _safe_divide(c, c + d)
        prr = _safe_divide(numerator, denominator)

        report_count = int(a)

        # Apply signal detection thresholds
        if prr >= PRR_SIGNAL_THRESHOLD and report_count >= MIN_REPORT_COUNT:
            p = _priority(prr)
            signals.append(
                {
                    "drug": drug,
                    "adverse_event": event,
                    "prr": round(prr, 4),
                    "report_count": report_count,
                    "priority": p,
                    "explanation": _explanation(drug, event, prr, report_count, p),
                }
            )

    # Sort: HIGH → MEDIUM → LOW, then by PRR descending within each group
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    signals.sort(key=lambda s: (priority_order[s["priority"]], -s["prr"]))

    return signals
