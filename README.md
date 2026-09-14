# PharmaGuard AI

**IBM Bob AI Hackathon — Team Tech Pirates — Problem Statement P2**

PharmaGuard AI is a full-stack web application that automates drug safety signal detection and regulatory submission readiness checking, with an AI Copilot powered by IBM watsonx.ai Granite.

---

## Features

| Module | What it does |
|---|---|
| **Safety Intelligence** | Upload an adverse-event CSV → detect potential safety signals using Proportional Reporting Ratio (PRR) |
| **Regulatory Intelligence** | Submit a CTD section manifest → receive a readiness score and prioritised gap list |
| **AI Copilot** | Ask natural-language questions — answers are grounded in your actual session data |
| **Dashboard** | Consolidated overview of signal count and regulatory readiness |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd src/backend
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env         # then fill in your API keys
uvicorn main:app --reload
```

Backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).  
OpenAPI docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend

```bash
cd src/frontend
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

> The Vite dev server proxies all `/api` requests to the backend automatically.

---

## AI Configuration

Add credentials to `src/backend/.env` (copy from `.env.example`):

```dotenv
# Option A — OpenRouter (preferred, free tier available)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Option B — IBM watsonx.ai (fallback)
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

The app runs in **demo/placeholder mode** without credentials — all features work, AI responses are clearly labelled as demo output.

---

## Project Structure

```
├── src/
│   ├── backend/          # FastAPI backend (Python)
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   ├── routers/      # safety, regulatory, copilot
│   │   ├── services/     # prr_calculator, ctd_checker, watsonx_client, openrouter_client
│   │   └── data/         # ctd_requirements.json, sample_adverse_events.csv
│   └── frontend/         # React + Vite frontend
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       └── src/          # App.jsx, components/, api/
├── docs/
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/screenshots/
├── presentation/
├── submission.yaml
├── CONTRIBUTING.md
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Backend status + AI provider configuration |
| GET | `/api/safety/demo` | Run PRR analysis on built-in synthetic dataset |
| POST | `/api/safety/analyze` | Upload CSV and detect safety signals |
| POST | `/api/regulatory/check` | Check CTD submission readiness |
| POST | `/api/copilot/chat` | AI Copilot query |

---

## Documentation

- [Problem Statement](docs/problem-statement.md)
- [Solution Overview](docs/solution-overview.md)
- [Architecture](docs/architecture.md)
- [Setup Guide](docs/setup-guide.md)

---

## Technology Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Recharts, Lucide React
- **Backend**: Python 3, FastAPI, uvicorn, pandas, pydantic
- **AI (primary)**: OpenRouter API (`openai`-compatible)
- **AI (secondary)**: IBM watsonx.ai — Granite model via `ibm-watsonx-ai` SDK

---

## Disclaimer

All safety signals detected by this tool are *potential signals only*. This tool does not establish causation between a drug and an adverse event. Results require expert pharmacovigilance review. The bundled demo dataset is entirely synthetic and does not represent real patients, drugs, or clinical data.
