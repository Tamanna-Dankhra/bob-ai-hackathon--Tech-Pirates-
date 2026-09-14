# Solution Overview — PharmaGuard AI

## What PharmaGuard AI Does

PharmaGuard AI is a full-stack web application that helps pharmaceutical and regulatory professionals:

1. **Detect potential drug safety signals** from adverse-event report data using the Proportional Reporting Ratio (PRR) method.
2. **Check regulatory submission readiness** of a CTD (Common Technical Document) against a structured requirements schema.
3. **Query an AI Copilot** that explains findings and answers natural-language questions — grounded in the actual analysis results loaded in the current session.

---

## Key Modules

### 1. Safety Intelligence

- Accepts a user-uploaded CSV (columns: `drug_name`, `adverse_event`, `report_count`) or a built-in synthetic demo dataset.
- Calculates PRR for every drug × adverse-event combination.
- Applies standard signal-detection thresholds:
  - **PRR ≥ 2.0** and **≥ 3 reports** → qualifies as a potential signal.
  - **PRR ≥ 5.0** → HIGH priority; **PRR 2–5** → MEDIUM; else LOW.
- Returns a ranked list of signals with plain-English explanations.
- Prominently disclaims that signals are *potential* only and do not establish causation.

### 2. Regulatory Intelligence

- Accepts JSON describing which CTD sections are present and their completeness status.
- Validates against a bundled `ctd_requirements.json` schema that defines required sections and their importance weights.
- Returns an overall readiness percentage, counts of complete/incomplete/missing sections, and a prioritised gap list.

### 3. AI Copilot

- Receives the current safety and regulatory analysis results as grounding context.
- Sends a structured prompt (system instruction + context + user question) to the configured AI provider.
- Provider priority chain:
  1. **OpenRouter** (preferred) — configurable model, e.g. `meta-llama/llama-3.1-8b-instruct:free`.
  2. **IBM watsonx.ai** — Granite model via `ibm-watsonx-ai` SDK.
  3. **Placeholder / Demo mode** — when no credentials are configured.
- Answers are grounded in the loaded session data; the copilot is instructed not to invent findings.

### 4. Dashboard

- Consolidates safety signal summary and regulatory readiness into a single overview.
- Displays signal count by priority and readiness percentage via Recharts visualisations.
- Intended as the first screen a reviewer sees to decide where to focus.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide React |
| Backend | Python 3, FastAPI, uvicorn, pandas, pydantic |
| AI — primary | OpenRouter API (`openai`-compatible SDK) |
| AI — secondary | IBM watsonx.ai (`ibm-watsonx-ai` SDK, Granite model) |
| Dev proxy | Vite proxy `/api` → `http://127.0.0.1:8000` |

---

## Design Principles

- **Grounded AI**: The copilot prompt is constructed from real analysis outputs, not free-form prompts. The model cannot hallucinate signal data it was not given.
- **Credential safety**: All API keys are environment-variable-only; `.env` is excluded from version control; the health endpoint exposes no secret values.
- **Graceful degradation**: Every module works in demo/placeholder mode without any API credentials.
- **Pharmacovigilance accuracy**: Signal calculations implement the standard WHO Uppsala Monitoring Centre PRR formula; thresholds are industry-standard.
