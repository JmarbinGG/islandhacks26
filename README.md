# byproduct.

A B2B marketplace for surplus materials - businesses list what they'd
otherwise throw out (pallets, scrap metal, cardboard, offcuts, overstock)
so other businesses can find and reuse it directly, no broker required.

Built at IslandHacks 2026.

## Stack

- **Frontend**: React 19 + TypeScript + Vite, React Router
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI**: pluggable image classifier (vision-language model via
  [build.nvidia.com](https://build.nvidia.com), local CLIP, or a
  dependency-free mock) that looks at a listing photo and suggests a name,
  category, tags, and quantity

## Features

- Browse and search listings, filter by category
- Sign up / sign in (bcrypt-hashed passwords, bearer-token sessions)
- Create a listing with a photo - "Choose File" or "Take Photo" (opens the
  camera directly on phones) - the photo is auto-analyzed to suggest the
  other fields, which you can edit before publishing
- Publishing a listing requires an account; listings are tied to the
  account that posted them
- "My Listings" - view and delete what you've posted

## Running it locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API listens on `http://localhost:8000`. On first run it creates
`listings.db` (SQLite) and seeds it with sample listings.

Optional `.env` in `backend/`:

```
NVIDIA_API_KEY=your-key-here      # enables real AI photo analysis
NVIDIA_VLM_MODEL=some/other-model # override the default vision model
```

Without `NVIDIA_API_KEY` set, photo analysis falls back to a mock
classifier so the upload flow still works end-to-end with zero extra
dependencies.

### Frontend

```bash
cd frontend/react
npm install
npm run dev
```

Opens on `http://localhost:5173` and talks to the backend on port 8000.
Works over LAN too (e.g. to test from a phone) - the frontend figures out
the right API host automatically from whatever hostname you loaded the
page from.

## Project structure

```
backend/
  main.py              FastAPI app: models, routes, auth
  ai/                  pluggable image classifier (nvidia / clip / mock)
frontend/react/
  src/
    pages/             one file per route
    components/        shared UI (navbar, listing cards, search bar, ...)
    api/                fetch wrappers for the backend
    auth/              signed-in user/session context
```
