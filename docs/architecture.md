# Architecture — PharmaGuard AI

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│                                                                   │
│  ┌──────────┐  ┌────────────────────┐  ┌───────────────────────┐ │
│  │Dashboard │  │ SafetyModule       │  │ RegulatoryModule      │ │
│  │          │  │ (CSV upload + PRR  │  │ (CTD JSON input +     │ │
│  │summary   │  │  signal display)   │  │  readiness report)    │ │
│  └──────────┘  └────────────────────┘  └───────────────────────┘ │
│                                                                   │
│                  ┌─────────────────────────┐                      │
│                  │  CopilotModule          │                      │
│                  │  (natural-language Q&A) │                      │
│                  └─────────────────────────┘                      │
│                                                                   │
│  src/frontend/src/api/client.js — fetch wrapper (base URL: /api) │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP (Vite proxy /api → :8000 in dev;
                         │         direct in production)
┌────────────────────────▼────────────────────────────────────────┐
│                    FastAPI Backend  (:8000)                       │
│                    src/backend/main.py                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Routers                                                      │ │
│  │  POST /api/safety/analyze      — CSV upload + PRR           │ │
│  │  GET  /api/safety/demo         — built-in demo dataset      │ │
│  │  POST /api/regulatory/check    — CTD readiness check        │ │
│  │  POST /api/copilot/chat        — AI copilot query           │ │
│  │  GET  /api/health              — health + provider status   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────┐  ┌─────────────────────────────────────┐  │
│  │ services/          │  │ data/                               │  │
│  │  prr_calculator.py │  │  sample_adverse_events.csv (demo)   │  │
│  │  ctd_checker.py    │  │  ctd_requirements.json (schema)     │  │
│  │  watsonx_client.py │  └─────────────────────────────────────┘  │
│  │  openrouter_client │                                           │
│  └───────────────────┘                                           │
└────────────────────────┬───────────────────────┬───────────────┘
                         │                       │
              ┌──────────▼──────┐    ┌──────────▼──────────────┐
              │  OpenRouter API  │    │  IBM watsonx.ai API      │
              │  (preferred)     │    │  (Granite model, fallback│
              │  openai SDK      │    │  ibm-watsonx-ai SDK)     │
              └─────────────────┘    └──────────────────────────┘
```

---

## Component Breakdown

### Frontend (`src/frontend/`)

| File | Role |
|---|---|
| `index.html` | Vite HTML entry |
| `vite.config.js` | Build config; dev-server proxy `/api` → `:8000` |
| `tailwind.config.js` / `postcss.config.js` | CSS toolchain |
| `src/main.jsx` | React root mount |
| `src/App.jsx` | Tab-based navigation shell; holds shared analysis state |
| `src/api/client.js` | Thin fetch wrapper — all API calls go through here |
| `src/components/Dashboard.jsx` | Summary charts (Recharts) |
| `src/components/SafetyModule.jsx` | CSV upload, signal list with priority badges |
| `src/components/RegulatoryModule.jsx` | CTD JSON input, readiness gauge, gap list |
| `src/components/CopilotModule.jsx` | Chat UI, context indicator, provider badge |

### Backend (`src/backend/`)

| File | Role |
|---|---|
| `main.py` | FastAPI app factory; CORS; router registration; health endpoint |
| `requirements.txt` | Python dependencies |
| `.env.example` | Template for required environment variables (safe to commit) |
| `routers/safety.py` | `/api/safety/*` — CSV parse, validate, delegate to prr_calculator |
| `routers/regulatory.py` | `/api/regulatory/*` — JSON parse, delegate to ctd_checker |
| `routers/copilot.py` | `/api/copilot/chat` — receive context, delegate to watsonx_client |
| `services/prr_calculator.py` | PRR formula; signal threshold logic; priority ranking |
| `services/ctd_checker.py` | CTD section validation against requirements schema |
| `services/watsonx_client.py` | IBM watsonx.ai SDK integration; prompt building; fallback chain |
| `services/openrouter_client.py` | OpenRouter API integration (openai-compatible) |
| `data/sample_adverse_events.csv` | Synthetic demo dataset (not real patient data) |
| `data/ctd_requirements.json` | CTD section requirement definitions and weights |

---

## Data Flow — Safety Signal Detection

```
User uploads CSV
    └─► POST /api/safety/analyze
        └─► safety.py validates columns & types
            └─► prr_calculator.calculate_prr(df)
                └─► for each drug×event: compute PRR using 2×2 contingency table
                    └─► filter PRR ≥ 2 AND count ≥ 3
                        └─► assign priority (HIGH / MEDIUM / LOW)
                            └─► return ranked signal list + summary
```

## Data Flow — AI Copilot

```
User asks a question (with safety/regulatory context in state)
    └─► POST /api/copilot/chat  {message, safety_results?, regulatory_results?}
        └─► watsonx_client.get_ai_response()
            ├─► Try OpenRouter (if OPENROUTER_API_KEY set)
            ├─► Try watsonx.ai  (if WATSONX_API_KEY + WATSONX_PROJECT_ID set)
            └─► Placeholder response (demo mode)
```

---

## Environment Variables

See [`src/backend/.env.example`](../src/backend/.env.example) for the full list.

| Variable | Provider | Required? |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter | Optional (preferred live AI) |
| `OPENROUTER_MODEL` | OpenRouter | Optional (defaults to llama-3.1-8b-instruct:free) |
| `WATSONX_API_KEY` | IBM watsonx.ai | Optional (fallback AI) |
| `WATSONX_PROJECT_ID` | IBM watsonx.ai | Optional (fallback AI) |
| `WATSONX_URL` | IBM watsonx.ai | Optional (defaults to us-south endpoint) |
| `WATSONX_MODEL_ID` | IBM watsonx.ai | Optional (defaults to ibm/granite-13b-chat-v2) |

No variable is required for the app to start — it runs in demo/placeholder mode without credentials.
