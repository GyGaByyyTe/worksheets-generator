# Worksheets Generator Monorepo

This repository is a pnpm workspace containing three packages:

- `@wg/core` — core generators and utilities (re-exporting existing logic from `scripts/`).
- `@wg/server` — Express REST API server that uses `@wg/core` to generate worksheets and serves the outputs.
- `@wg/web` — Next.js 15 (App Router, TypeScript) UI for requesting generations from the server and showing results.

## Prerequisites
- Node.js 18+
- pnpm 8+ (recommended to enable via Corepack)

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

## Install

From the repo root:

```powershell
pnpm install
```

## Development

You can start both the API server and the web app in parallel:

```powershell
pnpm dev
```

Or in separate terminals:

```powershell
pnpm dev:server  # starts @wg/server on http://localhost:4000
pnpm dev:web     # starts @wg/web on    http://localhost:3000
```

The web app will call the API at `http://localhost:4000` by default. To point the UI to a different backend URL, set the environment variable before running the web app:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000"
pnpm dev:web
```

## Build (production)

Build all workspace packages:

```powershell
pnpm build
```

Start production servers (in parallel):

```powershell
pnpm start
```

Or start separately in two terminals:

```powershell
pnpm start:server
pnpm start:web
```

## REST API (summary)

- `GET /health` — health check
- `GET /tasks` — available generator keys
- `POST /generate/worksheets` — body: `{ days: number, tasks: string[], seed?: any }`
  - Returns JSON with links to generated files under `/static/...`
- Static files are served from `/static`.

## Project Notes

- The legacy monolithic `server.js` and NPM `package-lock.json` were removed in favor of pnpm workspaces and the `@wg/server` package.
- Demo artifacts `result.svg` and `result.jpeg` were removed.
- Sample asset `base.jpg` is kept for local debug (`scripts/debug-dots.js`).
- The `scripts/` directory remains because `@wg/core` re-exports gen logic from there (minimal-change refactor). A later step may move sources fully under `packages/core`.

## Workspace Scripts (root)

- `pnpm dev` — run `@wg/server` and `@wg/web` in parallel
- `pnpm dev:server` — run only server
- `pnpm dev:web` — run only web
- `pnpm build` — build all packages
- `pnpm start` — start server and web in parallel (production)
- `pnpm start:server` — start only server
- `pnpm start:web` — start only web
- `pnpm test` — run tests across packages

## Packages

- `packages/core`
  - build: none (JS sources)
  - test: prints a simple ok message
- `packages/server`
  - dev/start: `node src/index.js`
  - build: none (JS sources)
- `packages/web`
  - dev: Next dev on port 3000
  - build/start: Next build and start (port 3000)
