# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.12.9-slim AS builder

WORKDIR /app

# Install build dependencies (psycopg2-binary needs libpq headers at build time)
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create an isolated venv so the runtime stage can copy it cleanly
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy dependency manifest first — Docker cache busts only when this changes,
# not on every source code edit.
COPY pyproject.toml ./

# Install all project dependencies + gunicorn into the venv
RUN pip install --upgrade pip \
    && pip install --no-cache-dir . \
    && pip install --no-cache-dir gunicorn


# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM python:3.12.9-slim AS runtime

# Install only the shared libraries needed at runtime (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        wget \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-built venv from the builder stage (no compilers in final image)
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user and group
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser

WORKDIR /app

# Copy application source (after deps so source changes don't bust the venv layer)
COPY . .

# Create directories that Django needs and hand over ownership
RUN mkdir -p /app/media /app/staticfiles \
    && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/api/health/ || exit 1

ENTRYPOINT ["sh", "entrypoint.sh"]
