"""
AI Copilot Router
==================
Context-aware AI assistant for PharmaGuard AI.

This router accepts the user's question AND the actual analysis results
(safety signals, regulatory gaps) so the AI can give specific, grounded answers
rather than generic responses.

IBM watsonx.ai integration is wired up via services/watsonx_client.py.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.watsonx_client import get_ai_response

router = APIRouter()


class CopilotContext(BaseModel):
    safety_results: dict[str, Any] | None = Field(
        default=None,
        description="The full JSON response from POST /api/safety/analyze.",
    )
    regulatory_results: dict[str, Any] | None = Field(
        default=None,
        description="The full JSON response from POST /api/regulatory/check.",
    )
    selected_signal: dict[str, Any] | None = Field(
        default=None,
        description=(
            "The individual signal the user clicked 'Ask AI' on in SafetyModule. "
            "Contains drug, adverse_event, prr, report_count, priority, explanation."
        ),
    )


class CopilotRequest(BaseModel):
    message: str = Field(
        ...,
        description="The user's question or instruction.",
        examples=["Why was Drug X flagged as a potential safety signal?"],
    )
    context: CopilotContext = Field(
        default_factory=CopilotContext,
        description="Analysis results to ground the AI's response.",
    )


@router.post("/chat")
def copilot_chat(body: CopilotRequest) -> dict[str, Any]:
    """
    Ask the AI Copilot a question about the current safety or regulatory analysis.

    The context object should contain the results from the safety and/or
    regulatory endpoints so the assistant can give specific, grounded answers.
    """
    response = get_ai_response(
        user_message=body.message,
        safety_results=body.context.safety_results,
        regulatory_results=body.context.regulatory_results,
        selected_signal=body.context.selected_signal,
    )
    return response
