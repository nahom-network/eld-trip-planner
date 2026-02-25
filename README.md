# Trip Planner ELD

A full-stack web application that plans long-haul truck driver trips with complete **FMCSA Hours-of-Service (HOS)** compliance. Given a current location, pickup point, drop-off point, and current cycle hours used, the app calculates an optimised stop schedule and automatically generates filled-out **ELD Daily Log Sheets** as downloadable PDFs.

---

## Features

- **Route Planning** — calculates the full driving route via the OpenRouteService API and renders it on an interactive Leaflet map with turn-by-turn stop markers.
- **HOS Compliance Engine** — enforces the 70 hr / 8-day property-carrying driver ruleset: mandatory 30-minute breaks, 11-hour driving limits, 10-hour rest periods, and 34-hour restarts.
- **ELD Log Generation** — programmatically draws FMCSA-compliant Daily Log Sheets (one per driving day) and exports them as PDF files for download.
- **Fuel Stop Scheduling** — automatically inserts fuelling stops at least every 1,000 miles.
- **Pickup & Drop-off Time** — accounts for 1 hour at both the pickup and drop-off locations.
- **Authentication** — JWT-based user accounts; each user's trip history is persisted and retrievable.
- **API Documentation** — auto-generated OpenAPI 3 schema with Swagger UI at `/api/schema/swagger-ui/`.

---

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Maps       | Leaflet + OpenRouteService (free tier)              |
| Backend    | Django 5, Django REST Framework, drf-spectacular    |
| Auth       | SimpleJWT                                           |
| PDF        | ReportLab                                           |
| DB (dev)   | SQLite                                              |
| DB (prod)  | PostgreSQL 16                                       |
| Serving    | Gunicorn + WhiteNoise (backend), nginx (frontend)   |
| Containers | Docker, Docker Compose                              |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2 (bundled with Docker Desktop)

### 1 — Clone and configure

```bash
git clone <repo-url>
cd spotter

# Create your local environment file and fill in the required values
cp .env.example .env
```

Open `.env` and set at minimum:

| Variable      | Description                            |
| ------------- | -------------------------------------- |
| `SECRET_KEY`  | Django secret key (long random string) |
| `DB_PASSWORD` | PostgreSQL password of your choice     |

### 2 — Build and start

```bash
docker compose up --build -d
```

This spins up three containers:

| Container  | Role                                                                       | Exposed port  |
| ---------- | -------------------------------------------------------------------------- | ------------- |
| `frontend` | nginx — serves the React SPA, proxies `/api/` and `/media/` to the backend | `80`          |
| `backend`  | Django + Gunicorn — REST API                                               | internal only |
| `db`       | PostgreSQL 16                                                              | internal only |

The backend runs `migrate` and `collectstatic` automatically on startup via `entrypoint.sh`.

### 3 — Open the app

```
http://localhost
```

API docs (Swagger UI): `http://localhost/api/schema/swagger-ui/`

### Stopping

```bash
docker compose down          # stop and remove containers
docker compose down -v       # also remove volumes (wipes the database)
```

---

## Development (without Docker)

### Backend

```bash
cd trip_planner
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The dev server proxies API calls to `http://localhost:8000` via the `VITE_API_BASE_URL` environment variable.

---

## Project Structure

```
spotter/
├── docker-compose.yml        # Orchestrates all services
├── .env.example              # Environment variable template
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── api/              # Axios API clients (auth, trips)
│   │   ├── components/       # UI components (map, timeline, ELD panel, …)
│   │   ├── pages/            # Route-level pages
│   │   ├── context/          # Auth context / JWT storage
│   │   └── types/            # Shared TypeScript types
│   ├── nginx.conf            # Production nginx config (SPA + API proxy)
│   └── Dockerfile            # Multi-stage: pnpm build → nginx:alpine
└── trip_planner/             # Django backend
    ├── trip/
    │   ├── services/
    │   │   ├── hos_engine.py      # HOS ruleset logic
    │   │   ├── route_service.py   # OpenRouteService integration
    │   │   └── eld_generator.py   # PDF log sheet renderer
    │   ├── views.py
    │   ├── serializers.py
    │   └── models.py
    ├── trip_planner/         # Django project settings
    ├── entrypoint.sh         # migrate + collectstatic + gunicorn
    └── Dockerfile            # Multi-stage: pip builder → python:slim
```

---

## API Overview

| Method | Endpoint                   | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| POST   | `/api/auth/register/`      | Create a new account                |
| POST   | `/api/auth/token/`         | Obtain JWT access + refresh tokens  |
| POST   | `/api/auth/token/refresh/` | Refresh access token                |
| POST   | `/api/trips/`              | Plan a new trip                     |
| GET    | `/api/trips/`              | List all trips for the current user |
| GET    | `/api/trips/{id}/`         | Retrieve a trip with full stop data |
| GET    | `/api/trips/{id}/logs/`    | Download ELD log PDFs               |
| GET    | `/api/health/`             | Service health check                |

Full interactive docs: `/api/schema/swagger-ui/`

---

## License

This software is proprietary. See [LICENSE](LICENSE) for terms. Commercial use requires a paid licence agreement with the author.
