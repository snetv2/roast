# roast

Submit a URL → see the technologies Cloudflare's URL Scanner detected on it → admins write a roast, hand out a star rating, and upload a logo for each one.

## Stack

- **web** — Vite + React + TypeScript SPA, served by nginx (also proxies `/api` to the API).
- **api** — Express + TypeScript. OIDC auth (Authorization Code + PKCE) via `openid-client`. Sessions in Postgres.
- **db** — Postgres 16.
- **logos** — uploaded to a docker-managed volume (`logo_data`), served by the API.

All three run under `docker compose`. Nothing is reachable without a valid session from your OIDC provider.

## First run

1. Copy `.env.example` → `.env` and fill in:
   - `OIDC_*` — your Authentik / S NET application's issuer, client id/secret, redirect URI.
   - `ADMIN_ROLE` — the Authentik group name that should get admin rights (default `roast-admin`).
   - `CF_ACCOUNT_ID` + `CF_API_TOKEN` — create a Cloudflare API token with **Account → URL Scanner → Edit**.
   - `SESSION_SECRET` — `openssl rand -hex 32`.
   - `PUBLIC_BASE_URL` — what the browser uses (e.g. `http://localhost:8080`). `OIDC_REDIRECT_URI` should be `${PUBLIC_BASE_URL}/api/auth/callback` and registered on the OIDC client.

2. Start the stack — by default it pulls prebuilt images from GHCR:
   ```
   docker compose up -d
   ```
   To build locally instead of pulling (useful while iterating before a release is published):
   ```
   docker compose up --build
   ```

3. Visit `http://localhost:8080`. You'll be bounced to the OIDC provider and back.

## How auth maps to roles

The API reads the `groups` claim from your id token. If `ADMIN_ROLE` is present, the user is an admin and the SPA shows edit controls. Everyone else can scan URLs and view results but not edit roasts.

## Cloudflare URL Scanner flow

`POST /api/scans { url }` submits a scan and returns a scan id. The SPA polls `GET /api/scans/:id` until `status === "ready"`, then renders the technology list (sourced from `meta.processors.wappa`). Each detected technology is upserted into the `technologies` table by slug so admins can attach a roast/rating/logo.

## Data

- `db_data` volume — Postgres data.
- `logo_data` volume — uploaded logos (served via `/api/logos/<filename>`).

Wipe state with `docker compose down -v`.

## GHCR images

Every push to `main` (and every `v*.*.*` tag) publishes two images via [.github/workflows/publish.yml](.github/workflows/publish.yml):

- `ghcr.io/snetv2/roast-api`
- `ghcr.io/snetv2/roast-web`

Tags produced: `latest` (main only), the branch name, `sha-<short>`, and the semver tag if pushed.

`docker-compose.yml` references these images directly (`ghcr.io/snetv2/roast-{api,web}:${TAG:-latest}`) with `pull_policy: always`, so `docker compose up -d` pulls fresh on every start. Pin to a specific release with `TAG=v1.2.3 docker compose up -d`. Pull on a schedule (or one-off) with `docker compose pull`.

First publish: the packages will be **private** by default. Open `https://github.com/snetv2/roast/pkgs/container/roast-api` (and `roast-web`) and either flip them to public, or `docker login ghcr.io` on the host before pulling.
