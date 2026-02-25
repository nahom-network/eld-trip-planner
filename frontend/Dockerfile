# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22.14-alpine3.21 AS builder

# Enable pnpm via corepack (matches the lockfile toolchain)
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first — maximises layer cache reuse
COPY package.json pnpm-lock.yaml ./

# Install all deps (including devDeps needed to build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .

# Accept the API base URL at build time (empty = same-origin, proxy handles it)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine3.21 AS runtime

# Replace default nginx config with SPA-friendly one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx runs as root — master process binds port and manages workers
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
