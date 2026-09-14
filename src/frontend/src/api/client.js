/**
 * PharmaGuard AI — API Client
 * Connects to the FastAPI backend at /api (proxied by Vite to http://127.0.0.1:8000)
 */

const BASE_URL = '/api'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || JSON.stringify(body)
    } catch (_) {
      detail = await res.text().catch(() => detail)
    }
    throw new Error(detail)
  }
  return res.json()
}

// ─── Safety ───────────────────────────────────────────────────────────────────

/**
 * Run safety analysis on the bundled synthetic demo dataset (no file upload needed).
 * Calls GET /api/safety/demo — the backend loads sample_adverse_events.csv itself.
 * @returns {Promise<object>} Same shape as analyzeSafety() response
 */
export async function loadDemoData() {
  const res = await fetch(`${BASE_URL}/safety/demo`)
  return handleResponse(res)
}

/**
 * Upload a CSV file and analyze adverse-event safety signals.
 * @param {File} file
 * @returns {Promise<object>} Backend response with summary + signals array
 */
export async function analyzeSafety(file) {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE_URL}/safety/analyze`, {
    method: 'POST',
    body: form,
  })
  return handleResponse(res)
}

// ─── Regulatory ───────────────────────────────────────────────────────────────

/**
 * Check submission readiness against ICH M4 CTD requirements.
 * @param {{ submitted_sections: string[], incomplete_sections: string[] }} data
 * @returns {Promise<object>} Readiness result with section statuses and gaps
 */
export async function checkRegulatory(data) {
  const res = await fetch(`${BASE_URL}/regulatory/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

// ─── Copilot ──────────────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI Copilot with analysis context.
 * @param {string} message
 * @param {{ safety_results: object|null, regulatory_results: object|null, selected_signal: object|null }} context
 * @returns {Promise<object>} Copilot response
 */
export async function sendCopilotMessage(message, context = {}) {
  const res = await fetch(`${BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context: {
        safety_results: context.safety_results ?? null,
        regulatory_results: context.regulatory_results ?? null,
        selected_signal: context.selected_signal ?? null,
      },
    }),
  })
  return handleResponse(res)
}
