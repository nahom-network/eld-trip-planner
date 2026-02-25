# Trip Planner ELD API

Django REST Framework backend that takes truck driver trip details, computes an FMCSA-compliant Hours of Service plan, and generates filled ELD Daily Log PDFs.

---

## Features

- **Route planning** via [OSRM](http://router.project-osrm.org) (no API key required)
- **Geocoding** via [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org) (no API key required)
- **Full FMCSA 70-hr/8-day HOS engine**
  - 11-hour driving limit per shift
  - 14-hour on-duty window
  - 30-minute break after 8 consecutive driving hours
  - Fuel stop every 1,000 miles (30 min)
  - 1-hour pickup and 1-hour dropoff
  - Cycle limit enforcement (`CycleExceededError`)
- **ELD Daily Log PDFs** generated with [reportlab](https://www.reportlab.com) — 24-hour grid drawn programmatically, one PDF per driving day
- **OpenAPI docs** via [drf-spectacular](https://drf-spectacular.readthedocs.io) (Swagger UI + ReDoc)
- **74 passing tests** (models, services, views — all external calls mocked)

---

## Tech Stack

| Layer            | Library                                     |
| ---------------- | ------------------------------------------- |
| Framework        | Django 6.0+, Django REST Framework 3.16+    |
| Routing          | OSRM public demo server                     |
| Geocoding        | Nominatim (OpenStreetMap)                   |
| PDF generation   | reportlab 4.2+                              |
| Database         | PostgreSQL (production), SQLite (local dev) |
| API docs         | drf-spectacular 0.29+                       |
| Static files     | WhiteNoise                                  |
| WSGI server      | Gunicorn                                    |
| Containerization | Docker (multi-stage) + Docker Compose       |

---

## API Endpoints

| Method | URL                               | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| `GET`  | `/api/health/`                    | Liveness probe                 |
| `POST` | `/api/trips/`                     | Plan a trip, generate ELD logs |
| `GET`  | `/api/trips/<id>/`                | Retrieve a planned trip        |
| `GET`  | `/api/trips/<id>/logs/<day>/pdf/` | Download ELD log PDF for a day |
| `GET`  | `/api/docs/`                      | Swagger UI                     |
| `GET`  | `/api/redoc/`                     | ReDoc                          |
| `GET`  | `/api/schema/`                    | Raw OpenAPI schema (YAML)      |

### POST `/api/trips/` — Request body

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 20.5
}
```

`current_cycle_used` must be between `0` and `69.99` hours.

### POST `/api/trips/` — Response (201)

```json
{
  "id": 1,
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used": 20.5,
  "total_distance_miles": 843.2,
  "estimated_duration_hours": 12.6,
  "route_polyline": { "type": "LineString", "coordinates": [...] },
  "status": "completed",
  "stops": [
    {
      "stop_type": "start",
      "arrival_time": "2026-02-25T08:00:00Z",
      "departure_time": "2026-02-25T08:00:00Z",
      "duration_hours": 0.0,
      "cumulative_miles": 0.0,
      "order": 1
    },
    ...
  ],
  "daily_logs": [
    {
      "date": "2026-02-25",
      "day_number": 1,
      "activities": [...],
      "total_off_duty_hours": 0.0,
      "total_sleeper_berth_hours": 0.0,
      "total_driving_hours": 11.0,
      "total_on_duty_nd_hours": 2.0,
      "cycle_hours_used": 33.0,
      "pdf_url": "http://localhost:8000/media/eld_logs/trip_1_day_1.pdf"
    }
  ]
}
```

---

## Local Development

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (or pip)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd trip_planner

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -e .
# or with uv:
uv sync

# Run migrations (uses SQLite by default when DEBUG=True)
python manage.py migrate

# Start the dev server
python manage.py runserver
```

Open [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) for the Swagger UI.

### Run Tests

```bash
python manage.py test trip --verbosity=2
# Expected: Ran 74 tests ... OK
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values for production:

```bash
cp .env.example .env
```

| Variable        | Default                    | Description                           |
| --------------- | -------------------------- | ------------------------------------- |
| `SECRET_KEY`    | _(required in production)_ | Django secret key                     |
| `DEBUG`         | `True`                     | Set to `False` in production          |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1`      | Comma-separated list of allowed hosts |
| `DB_NAME`       | `trip_planner`             | PostgreSQL database name              |
| `DB_USER`       | `trip_planner`             | PostgreSQL user                       |
| `DB_PASSWORD`   | _(required)_               | PostgreSQL password                   |
| `DB_HOST`       | `db`                       | PostgreSQL host                       |
| `DB_PORT`       | `5432`                     | PostgreSQL port                       |

> When `DEBUG=True`, SQLite is used automatically — no PostgreSQL needed for local dev.

---

## Docker

```bash
# Copy and fill in env vars
cp .env.example .env

# Build and start (PostgreSQL + Django)
docker compose up --build

# The API will be available at http://localhost:8000
```

The Docker setup uses a multi-stage build (builder + slim runtime), runs as a non-root user, and includes a health check on `/api/health/`.

---

## Project Structure

```
trip_planner/
├── trip/
│   ├── models.py              # Trip, Stop, DailyLog models
│   ├── serializers.py         # DRF serializers
│   ├── views.py               # API views
│   ├── urls.py                # App URL patterns
│   ├── admin.py               # Django admin with inlines
│   ├── services/
│   │   ├── route_service.py   # Geocoding (Nominatim) + routing (OSRM)
│   │   ├── hos_engine.py      # FMCSA HOS rule engine
│   │   └── eld_generator.py   # ELD Daily Log PDF generation (reportlab)
│   └── tests/
│       ├── test_models.py
│       ├── test_route_service.py
│       ├── test_hos_engine.py
│       ├── test_eld_generator.py
│       └── test_views.py
├── trip_planner/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── pyproject.toml
└── .env.example
```

---

## HOS Rules Reference

| Rule                             | Limit                             |
| -------------------------------- | --------------------------------- |
| Driving per shift                | 11 hours                          |
| On-duty window                   | 14 hours from shift start         |
| Consecutive driving before break | 8 hours → 30-min break            |
| Fuel interval                    | 1,000 miles → 30-min fuel stop    |
| Required off-duty rest           | 10 hours                          |
| Cycle                            | 70 hours / 8 days                 |
| Pickup / Dropoff                 | 1 hour each (on-duty not driving) |

All cycle and shift state is tracked across day boundaries. If the remaining cycle hours are exhausted, the API returns a `422 Unprocessable Entity` error.
