"""
IBM watsonx.ai Client
======================
Handles communication with IBM watsonx.ai for the PharmaGuard AI Copilot.

Authentication uses environment variables — never hardcode credentials.

Required environment variables (when using real watsonx.ai):
    WATSONX_API_KEY      IBM Cloud API key
    WATSONX_PROJECT_ID   watsonx.ai project ID
    WATSONX_URL          Service URL (default: https://us-south.ml.cloud.ibm.com)
    WATSONX_MODEL_ID     Model ID   (default: ibm/granite-13b-chat-v2)

If the variables are absent the service falls back to Demo/placeholder mode
so the rest of the application continues to work without credentials.
"""

from __future__ import annotations

import os
from typing import Any

# ──────────────────────────────────────────────────────────────────────────────
# Configuration — read from environment at import time
# ──────────────────────────────────────────────────────────────────────────────

WATSONX_API_KEY    = os.environ.get("WATSONX_API_KEY", "").strip()
WATSONX_URL        = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com").strip()
WATSONX_PROJECT_ID = os.environ.get("WATSONX_PROJECT_ID", "").strip()
WATSONX_MODEL_ID   = os.environ.get("WATSONX_MODEL_ID", "ibm/granite-13b-chat-v2").strip()

def _is_configured() -> bool:
    """Return True only when all required credentials are present."""
    return bool(WATSONX_API_KEY and WATSONX_PROJECT_ID)


# ──────────────────────────────────────────────────────────────────────────────
# System prompt — grounded in application data
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_INSTRUCTION = (
    "You are PharmaGuard AI Copilot, an expert pharmacovigilance and "
    "regulatory-support assistant. "
    "Answer only using the analysis context supplied by the application. "
    "Do not invent safety findings, regulatory requirements, or data. "
    "Potential safety signals do not establish causation. "
    "Give concise, actionable explanations."
)


# ──────────────────────────────────────────────────────────────────────────────
# Prompt builder — combines system instruction + context + user question
# ──────────────────────────────────────────────────────────────────────────────

def _build_prompt(
    user_message: str,
    safety_results: dict[str, Any] | None,
    regulatory_results: dict[str, Any] | None,
) -> str:
    """
    Assemble a single prompt string to send to the model.
    Keeps the context concise to stay within token limits.
    """
    sections: list[str] = [SYSTEM_INSTRUCTION]

    if safety_results:
        num_signals = safety_results.get("summary", {}).get("num_potential_signals", 0)
        signals = safety_results.get("signals", [])
        signal_lines = "\n".join(
            f"  - {s['drug']} / {s['adverse_event']}: "
            f"PRR={s['prr']}, count={s['report_count']}, priority={s['priority']}"
            for s in signals[:10]          # cap at 10 to stay within token limit
        )
        sections.append(
            f"SAFETY ANALYSIS RESULTS:\n"
            f"Total potential signals detected: {num_signals}\n"
            f"{signal_lines}"
        )

    if regulatory_results:
        readiness   = regulatory_results.get("readiness_percentage", "N/A")
        complete    = regulatory_results.get("complete_count", 0)
        incomplete  = regulatory_results.get("incomplete_count", 0)
        missing     = regulatory_results.get("missing_count", 0)
        top_gaps    = regulatory_results.get("prioritized_gaps", [])[:5]
        gap_lines   = "\n".join(
            f"  - [{g['priority']}] Section {g['section']} "
            f"({g['status']}): {g['title']}"
            for g in top_gaps
        )
        sections.append(
            f"REGULATORY READINESS RESULTS:\n"
            f"Readiness: {readiness}%  |  Complete: {complete}  "
            f"Incomplete: {incomplete}  Missing: {missing}\n"
            f"Top gaps:\n{gap_lines}"
        )

    sections.append(f"USER QUESTION:\n{user_message}")

    return "\n\n".join(sections)


# ──────────────────────────────────────────────────────────────────────────────
# Real watsonx.ai call
# ──────────────────────────────────────────────────────────────────────────────

def _call_watsonx_real(prompt: str) -> str:
    """
    Call IBM watsonx.ai using the ibm-watsonx-ai SDK.

    Raises
    ------
    RuntimeError  — if credentials are missing or the API call fails.
    """
    # Lazy import so the SDK is only loaded when actually needed.
    try:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference
        from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
    except ImportError as exc:
        raise RuntimeError(
            "ibm-watsonx-ai SDK is not installed. "
            "Run: pip install ibm-watsonx-ai"
        ) from exc

    if not WATSONX_API_KEY:
        raise RuntimeError(
            "WATSONX_API_KEY environment variable is not set. "
            "Please configure credentials."
        )
    if not WATSONX_PROJECT_ID:
        raise RuntimeError(
            "WATSONX_PROJECT_ID environment variable is not set. "
            "Please configure credentials."
        )

    credentials = Credentials(
        url=WATSONX_URL,
        api_key=WATSONX_API_KEY,
    )

    params = {
        GenParams.MAX_NEW_TOKENS:      512,
        GenParams.MIN_NEW_TOKENS:      10,
        GenParams.TEMPERATURE:         0.2,
        GenParams.REPETITION_PENALTY:  1.1,
    }

    model = ModelInference(
        model_id=WATSONX_MODEL_ID,
        credentials=credentials,
        project_id=WATSONX_PROJECT_ID,
        params=params,
    )

    response = model.generate_text(prompt=prompt)

    # generate_text returns a string directly
    if isinstance(response, str):
        return response.strip()

    # Defensive: handle unexpected return type
    raise RuntimeError(
        f"Unexpected response type from watsonx.ai: {type(response).__name__}. "
        f"Value: {str(response)[:200]}"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Placeholder response (used when credentials are absent)
# ──────────────────────────────────────────────────────────────────────────────

def _call_watsonx_placeholder(prompt: str) -> str:
    """
    Returns a clearly-marked placeholder response.
    Used when WATSONX_API_KEY / WATSONX_PROJECT_ID are not configured.
    """
    preview = prompt[:300].replace("\n", " ")
    return (
        "[PLACEHOLDER - IBM watsonx.ai not yet connected]\n\n"
        "The AI Copilot is ready and fully context-aware. "
        "Set WATSONX_API_KEY and WATSONX_PROJECT_ID environment variables "
        "to activate real AI responses.\n\n"
        f"The system prompt sent to the model would begin with:\n{preview}…"
    )


# ──────────────────────────────────────────────────────────────────────────────
# Public entry point — called by the copilot router
# Provider chain: OpenRouter (if configured) → watsonx (if configured) → placeholder
# ──────────────────────────────────────────────────────────────────────────────

def get_ai_response(
    user_message: str,
    safety_results: dict[str, Any] | None = None,
    regulatory_results: dict[str, Any] | None = None,
    selected_signal: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Generate an AI response grounded in the provided analysis context.

    Provider priority:
        1. OpenRouter  — when OPENROUTER_API_KEY is set
        2. watsonx.ai  — when WATSONX_API_KEY + WATSONX_PROJECT_ID are set
        3. Placeholder — demo mode when neither provider is configured

    Returns a dict with:
        answer                  — the model's response text
        model                   — model ID used (or "placeholder")
        provider                — "openrouter" | "watsonx" | "placeholder"
        watsonx_ready           — True when a real watsonx call was made (legacy field)
        openrouter_ready        — True when an OpenRouter call was made
        context_used            — which analysis contexts were included
        error                   — error message if the live call failed (optional)
    """
    context_used = {
        "safety_results_provided": safety_results is not None,
        "regulatory_results_provided": regulatory_results is not None,
    }

    # ── 1. Try OpenRouter first ───────────────────────────────────────────────
    try:
        from services.openrouter_client import (
            call_openrouter,
            is_configured as openrouter_configured,
            OPENROUTER_MODEL,
        )
    except ImportError:
        openrouter_configured = lambda: False  # noqa: E731

    if openrouter_configured():
        try:
            answer = call_openrouter(user_message, safety_results, regulatory_results, selected_signal)
            return {
                "answer": answer,
                "model": OPENROUTER_MODEL,
                "provider": "openrouter",
                "watsonx_ready": False,
                "openrouter_ready": True,
                "context_used": context_used,
            }
        except Exception as exc:
            or_error = f"OpenRouter request failed: {type(exc).__name__}: {exc}"
            # Surface the error but continue to next provider
        else:
            or_error = None
    else:
        or_error = None

    # ── 2. Try watsonx.ai ─────────────────────────────────────────────────────
    prompt = _build_prompt(user_message, safety_results, regulatory_results)
    wx_error: str | None = None

    if _is_configured():
        try:
            answer = _call_watsonx_real(prompt)
            return {
                "answer": answer,
                "model": WATSONX_MODEL_ID,
                "provider": "watsonx",
                "watsonx_ready": True,
                "openrouter_ready": False,
                "context_used": context_used,
            }
        except RuntimeError as exc:
            wx_error = str(exc)
        except Exception as exc:
            wx_error = f"watsonx.ai request failed: {type(exc).__name__}: {exc}"

    # ── 3. Placeholder fallback ───────────────────────────────────────────────
    answer = _call_watsonx_placeholder(prompt)

    errors: list[str] = [e for e in (or_error, wx_error) if e]
    note = (
        "Set OPENROUTER_API_KEY (preferred) or WATSONX_API_KEY + WATSONX_PROJECT_ID "
        "to activate live AI responses."
    )

    result: dict[str, Any] = {
        "answer": answer,
        "model": "placeholder",
        "provider": "placeholder",
        "watsonx_ready": False,
        "openrouter_ready": False,
        "context_used": context_used,
        "note": note,
    }

    if errors:
        result["error"] = " | ".join(errors)
        result["answer"] = (
            "[AI provider error — falling back to demo mode]\n\n"
            + "\n".join(errors)
            + "\n\nPlease check your credentials and try again."
        )

    return result


# ──────────────────────────────────────────────────────────────────────────────
# Configuration status — safe to expose via the health endpoint (no secrets)
# ──────────────────────────────────────────────────────────────────────────────

def get_watsonx_config_status() -> dict[str, Any]:
    """
    Return configuration status without exposing any credential values.
    Safe to include in API health responses.
    """
    return {
        "configured": _is_configured(),
        "api_key_set": bool(WATSONX_API_KEY),
        "project_id_set": bool(WATSONX_PROJECT_ID),
        "url": WATSONX_URL,
        "model_id": WATSONX_MODEL_ID,
        "sdk_version": _get_sdk_version(),
    }


def _get_sdk_version() -> str:
    try:
        from importlib.metadata import version
        return version("ibm-watsonx-ai")
    except Exception:
        return "unknown"
