# Contributing to PharmaGuard AI

Thank you for your interest in contributing to PharmaGuard AI!

---

## Getting Started

1. **Fork** the repository and clone your fork locally.
2. Follow the [Setup Guide](docs/setup-guide.md) to get the application running.
3. Create a branch for your change:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## Development Workflow

### Backend changes (`src/backend/`)

- Run the backend with `uvicorn main:app --reload` from `src/backend/`.
- Add any new Python dependencies to `requirements.txt`.
- Keep services stateless — do not hardcode credentials or API keys anywhere.
- All environment variables must be read from `os.environ` (loaded via `python-dotenv`).

### Frontend changes (`src/frontend/`)

- Run the frontend with `npm run dev` from `src/frontend/`.
- Follow the existing component pattern: one file per module in `src/components/`.
- All API calls must go through `src/api/client.js`.

---

## Code Style

- **Python**: Follow PEP 8. Use type hints where practical.
- **JavaScript/JSX**: Follow the existing React functional component style. No class components.
- **No linter is currently enforced**, but keep diffs clean.

---

## Important Rules

- **Never commit `.env` files or API keys.** The `.gitignore` already blocks `src/backend/.env`.
- **Never hardcode credentials** in source files.
- **Do not modify** `src/backend/.env.example` to include real credentials.
- All safety signal output must include the pharmacovigilance disclaimer that signals are *potential* only and do not establish causation.

---

## Pull Requests

1. Make sure the backend starts cleanly: `uvicorn main:app --reload` from `src/backend/`.
2. Make sure the frontend builds without errors: `npm run build` from `src/frontend/`.
3. Write a clear PR description explaining what changed and why.
4. Reference any related issue numbers.

---

## Reporting Issues

Open a GitHub Issue describing:
- What you expected to happen.
- What actually happened.
- Steps to reproduce.
- Your OS, Python version, and Node.js version.
