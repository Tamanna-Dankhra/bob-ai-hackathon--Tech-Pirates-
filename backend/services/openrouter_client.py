"""
OpenRouter Client — PharmaGuard AI Copilot
===========================================
Provides live AI responses via OpenRouter's OpenAI-compatible Chat Completions API.

Authentication uses environment variables — never hardcode credentials.

Required environment variables:
    OPENROUTER_API_KEY      Your OpenRouter API key
    OPENROUTER_BASE_URL     API base URL (default: https://openrouter.ai/api/v1)
    OPENROUTER_MODEL        Model identifier (default: openrouter/free)

If OPENROUTER_API_KEY is absent this module raises RuntimeError so the caller
can fall back gracefully — it never crashes the application.
"""

from __future__ import annotations

import os
from typing import Any

# ──────────────────────────────────────────────────────────────────────────────
# Configuration — read from environment (populated by load_dotenv in main.py)
# ──────────────────────────────────────────────────────────────────────────────

OPENROUTER_API_KEY  = os.environ.get("OPENROUTER_API_KEY", "").strip()
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip()
OPENROUTER_MODEL    = os.environ.get("OPENROUTER_MODEL", "openrouter/free").strip()

# Referrer headers sent to OpenRouter (good practice, not secret)
_APP_SITE_URL  = "http://localhost:5173"
_APP_NAME      = "PharmaGuard AI"


def is_configured() -> bool:
    """Return True when the API key is present and non-empty."""
    return bool(OPENROUTER_API_KEY)


def get_config_status() -> dict[str, Any]:
    """
    Return configuration status safe for the /api/health endpoint.
    Never returns the actual API key value.
    """
    return {
        "configured": is_configured(),
        "api_key_set": bool(OPENROUTER_API_KEY),
        "base_url": OPENROUTER_BASE_URL,
        "model": OPENROUTER_MODEL,
    }


# ──────────────────────────────────────────────────────────────────────────────
# PharmaGuard system instruction
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_INSTRUCTION = (
    "You are PharmaGuard AI Copilot, an assistant for pharmaceutical "
    "drug-safety signal review and regulatory submission readiness. "
    "Use only the supplied application context. "
    "Clearly distinguish calculated safety signals from confirmed causality. "
    "Potential safety signals do not establish causation. "
    "Do not invent adverse-event counts, PRR values, CTD sections, regulatory "
    "requirements, or other facts not present in the supplied context. "
    "Give concise, practical explanations and identify when expert/regulatory "
    "review is required."
)


# ──────────────────────────────────────────────────────────────────────────────
# Context builder — assembles the user message with analysis data
# ──────────────────────────────────────────────────────────────────────────────

def build_user_message(
    user_question: str,
    safety_results: dict[str, Any] | None,
    regulatory_results: dict[str, Any] | None,
    selected_signal: dict[str, Any] | None = None,
) -> str:
    """
    Combine the user's question with the full analysis context into a
    single user-role message.  The system instruction is sent separately as
    the system role message.

    Context sections included (when data is available):
      - Full safety summary (total reports, drugs, events, signal count)
      - All detected signals with PRR, report count, priority
      - The specific signal the user clicked on (selected_signal)
      - Regulatory readiness percentage, section counts, top gaps
    """
    parts: list[str] = []

    if safety_results:
        summary    = safety_results.get("summary", {})
        total_rpts = summary.get("total_reports", "N/A")
        num_drugs  = summary.get("num_drugs", "N/A")
        num_events = summary.get("num_adverse_events", "N/A")
        num_sigs   = summary.get("num_potential_signals", 0)
        signals    = safety_results.get("signals", [])

        signal_lines = "\n".join(
            f"  {i+1}. {s['drug']} / {s['adverse_event']}: "
            f"PRR={s['prr']}, reports={s['report_count']}, priority={s['priority']}"
            for i, s in enumerate(signals[:10])   # cap at 10 for token budget
        )
        parts.append(
            f"[SAFETY ANALYSIS CONTEXT]\n"
            f"Dataset: {total_rpts} total reports across {num_drugs} drugs "
            f"and {num_events} distinct adverse events.\n"
            f"Potential signals detected: {num_sigs}\n"
            f"Signals (sorted by priority then PRR descending):\n"
            f"{signal_lines}"
        )

    if selected_signal:
        parts.append(
            f"[SELECTED / FOCUS SIGNAL]\n"
            f"Drug: {selected_signal.get('drug', 'N/A')}\n"
            f"Adverse Event: {selected_signal.get('adverse_event', 'N/A')}\n"
            f"PRR: {selected_signal.get('prr', 'N/A')}\n"
            f"Report Count: {selected_signal.get('report_count', 'N/A')}\n"
            f"Priority: {selected_signal.get('priority', 'N/A')}\n"
            f"Explanation: {selected_signal.get('explanation', 'N/A')}"
        )

    if regulatory_results:
        readiness  = regulatory_results.get("readiness_percentage", "N/A")
        total_req  = regulatory_results.get("total_requirements", "N/A")
        complete   = regulatory_results.get("complete_count", 0)
        incomplete = regulatory_results.get("incomplete_count", 0)
        missing    = regulatory_results.get("missing_count", 0)
        top_gaps   = regulatory_results.get("prioritized_gaps", [])[:5]
        gap_lines  = "\n".join(
            f"  - [{g['priority']}] Section {g['section']} "
            f"({g['status']}): {g['title']}"
            for g in top_gaps
        )
        parts.append(
            f"[REGULATORY READINESS CONTEXT]\n"
            f"ICH M4 CTD readiness: {readiness}% "
            f"({complete} complete, {incomplete} incomplete, {missing} missing "
            f"out of {total_req} total sections)\n"
            f"Top priority gaps:\n{gap_lines}"
        )

    parts.append(f"[USER QUESTION]\n{user_question}")

    return "\n\n".join(parts)


# ──────────────────────────────────────────────────────────────────────────────
# Live OpenRouter call
# ──────────────────────────────────────────────────────────────────────────────

def call_openrouter(
    user_question: str,
    safety_results: dict[str, Any] | None = None,
    regulatory_results: dict[str, Any] | None = None,
    selected_signal: dict[str, Any] | None = None,
) -> str:
    """
    Send the question + context to OpenRouter and return the assistant's text.

    Raises
    ------
    RuntimeError  — if the API key is missing or the request fails.
                    The caller should catch this and fall back to placeholder mode.
    """
    if not OPENROUTER_API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. "
            "Add it to backend/.env to enable OpenRouter."
        )

    # Lazy import — only needed when actually calling the API
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError(
            "The 'openai' package is not installed. "
            "Run: pip install openai"
        ) from exc

    client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )

    user_msg = build_user_message(
        user_question, safety_results, regulatory_results, selected_signal
    )

    try:
        completion = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user",   "content": user_msg},
            ],
            extra_headers={
                "HTTP-Referer": _APP_SITE_URL,
                "X-Title":      _APP_NAME,
            },
            max_tokens=1024,
            temperature=0.2,
        )
    except Exception as exc:
        raise RuntimeError(
            f"OpenRouter API request failed: {type(exc).__name__}: {exc}"
        ) from exc

    # Extract the response text.
    # Some free/thinking models route through OpenRouter with reasoning tokens
    # and may return content=None while putting the answer in reasoning_content.
    choice = completion.choices[0] if completion.choices else None
    if choice is None or choice.message is None:
        raise RuntimeError("OpenRouter returned an empty response (no choices).")

    text = choice.message.content

    # Fallback: some reasoning models expose text via model_extra
    if not text:
        msg_extra = getattr(choice.message, "model_extra", {}) or {}
        text = (
            msg_extra.get("reasoning_content")
            or msg_extra.get("reasoning")
            or ""
        )

    if not text:
        raise RuntimeError(
            f"OpenRouter returned an empty message content "
            f"(finish_reason={choice.finish_reason!r}, "
            f"model={completion.model!r}). "
            "Try a different OPENROUTER_MODEL in backend/.env."
        )

    return text.strip()
