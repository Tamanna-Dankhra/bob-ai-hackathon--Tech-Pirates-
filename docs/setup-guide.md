# Setup Guide — PharmaGuard AI

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 or later |
| Node.js | 18 or later |
| npm | 9 or later |
| git | any recent version |

---

## 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/bob-ai-hackathon--Tech-Pirates-.git
cd bob-ai-hackathon--Tech-Pirates-
```

---

## 2. Backend Setup

### 2a. Create and activate a virtual environment

```bash
cd src/backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 2b. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2c. Configure environment variables

```bash
# Copy the example file
cp .env.example .env
```

Open `src/backend/.env` and fill in at least one AI provider:

```dotenv
# Option A — OpenRouter (recommended, free tier available)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Option B — IBM watsonx.ai
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
```

> **Note:** The app runs in demo/placeholder mode if no credentials are provided. All features work; AI responses will be clearly labelled as placeholder output.

### 2d. Start the backend

```bash
# From src/backend/ (with virtualenv active)
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Verify: open [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) — you should see `"status": "ok"`.

---

## 3. Frontend Setup

### 3a. Install Node dependencies

```bash
cd src/frontend
npm install
```

### 3b. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The Vite dev server proxies all `/api` requests to `http://127.0.0.1:8000`, so the backend must be running simultaneously.

---

## 4. Running Both Services Together

Open two terminal windows:

**Terminal 1 — Backend**
```bash
cd src/backend
.venv\Scripts\activate   # (Windows) or source .venv/bin/activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend**
```bash
cd src/frontend
npm run dev
```

Browse to [http://localhost:5173](http://localhost:5173).

---

## 5. Production Build (Frontend)

```bash
cd src/frontend
npm run build
```

The compiled static assets are output to `src/frontend/dist/`. Serve them with any static file server or configure FastAPI to serve the `dist/` folder directly.

---

## 6. API Reference (Quick)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Backend health + AI provider config status |
| GET | `/api/safety/demo` | Run PRR analysis on built-in demo dataset |
| POST | `/api/safety/analyze` | Upload CSV and run PRR signal detection |
| POST | `/api/regulatory/check` | Check CTD submission readiness from JSON |
| POST | `/api/copilot/chat` | AI Copilot — natural-language query |

Full OpenAPI docs are available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) when the backend is running.

---

## 7. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `uvicorn: command not found` | venv not active | Activate the venv first |
| Frontend shows network errors | Backend not running | Start `uvicorn` in Terminal 1 |
| AI Copilot returns placeholder text | No credentials in `.env` | Add `OPENROUTER_API_KEY` or watsonx keys |
| `ibm-watsonx-ai` import error | SDK not installed | Run `pip install ibm-watsonx-ai` |
| Vite port 5173 already in use | Another process | Kill the process or use `vite --port 5174` |
