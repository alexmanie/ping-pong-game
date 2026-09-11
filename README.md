# Ping Pong Game

Single-player browser Pong game built with **Vite + TypeScript + HTML Canvas**.

## Features

- Player paddle controls: `ArrowUp`, `ArrowDown`, `W`, `S`
- Computer-controlled paddle
- Ball movement, wall/paddle collisions, scoring
- First-to-7 win condition
- Restart via button or `Enter` / `Space` after game over
- Stateless static frontend (safe for horizontal scaling)

## Local development

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Production build

```bash
npm run build
```

Build output is generated in `dist/`.

## Run production container locally

Build image:

```bash
docker build -t ping-pong-game:local .
```

Run container:

```bash
docker run --rm -p 8080:8080 ping-pong-game:local
```

Open: `http://localhost:8080`

## Azure Container Apps deployment (user-run)

This repository is deployment-ready; deployment is intentionally not executed by the agent.

Example CLI flow:

```bash
# 1) Build and push image to your registry (example with ACR)
az acr login --name <acrName>
docker tag ping-pong-game:local <acrName>.azurecr.io/ping-pong-game:latest
docker push <acrName>.azurecr.io/ping-pong-game:latest

# 2) Create/update container app
az containerapp up \
  --name ping-pong-game \
  --resource-group <resourceGroup> \
  --location <location> \
  --image <acrName>.azurecr.io/ping-pong-game:latest \
  --target-port 8080 \
  --ingress external
```

## Runtime behavior for Container Apps suitability

- **Container port**: `8080` (Nginx listens on `0.0.0.0:8080`)
- **Health behavior**: HTTP requests to `/` return `index.html` (`try_files ... /index.html`)
- **Stateless serving**: no backend, no sessions, no local persistence; each request is independently served static assets

## Verification log

| Check | Result | Evidence |
|---|---|---|
| Install and build | ✅ Pass | `npm install` succeeded; `npm run build` succeeded and produced `dist/` |
| Local start | ✅ Pass | `npm run dev -- --host 0.0.0.0 --port 5173` started; `curl http://127.0.0.1:5173` returned app HTML |
| Core game elements | ✅ Pass (implemented) | `src/main.ts` renders canvas, paddles, moving ball, scoring, collision handling, restart |
| Safe controls | ✅ Pass (implemented) | Input handler only reacts to `ArrowUp`, `ArrowDown`, `KeyW`, `KeyS`, and restart keys when game over |
| Production container | ✅ Pass | `docker build` succeeded; `docker run -p 8080:8080` stayed up; `curl http://127.0.0.1:8080` returned game page |
| Container Apps suitability | ✅ Pass | Port 8080 + static/stateless Nginx serving documented and configured |
| Browser baseline (Firefox/Chrome/Edge) | ⚠️ Pending manual verification | Automated environment could not execute multi-browser interactive checks; must be verified by user on current browsers |
| First playtest follow-ups | ⚠️ Pending user playtest | No user playtest observations yet; record issues and convert each to explicit pass/fail checks in next cycle |

## Assumptions

- Baseline browser versions are current stable Firefox, Chrome, and Edge.
- Port `8080` is used inside the production container.
- Initial visuals and difficulty are acceptable until user playtest feedback requests adjustments.
