# Orochi UI

Web dashboard for the **Open Data Annotation Platform** -- a train inspection and video annotation system deployed on edge servers at Tokyu Corporation rail sites. Built with Angular 19, Angular Material, and Tailwind CSS on the Fuse admin template.

## Features

- **Dashboard** -- paginated task list of train annotation jobs with verdict summaries (Accepted / Rejected / Not Annotated), polar-area chart, date-range and verdict filtering, URL-synchronized filters
- **Task details** -- frame-level annotation viewer with SVG overlays (rectangles, polygons, polylines, ellipses, cuboids, points), video grid playback, and a commenting system
- **Edge monitoring** -- real-time status of the on-site edge server: RFID reader, laser sensors, 6 RTSP cameras, CPU/memory/disk gauges, internal and external service health, network infrastructure devices, and iDRAC hardware health
- **Internationalization** -- English (source), Japanese, and Hindi via Angular i18n (build-time XLF2) plus Transloco (runtime)
- **Authentication** -- cookie-based session auth with CSRF protection, sign-in/sign-up/forgot-password/reset-password flows

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20 (see `.nvmrc`) |
| npm | 10+ |

> **Note:** The project specifies Node 20 in `.nvmrc`. If you use nvm, run `nvm use` before installing.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

This runs `ng serve -c en` with the dev proxy pointing to `https://OKKUNsys.tokyu.co.jp/`. Open `http://localhost:4200/` in your browser.

To serve in Japanese or Hindi:

```bash
npm run start-ja
npm run start-te    # Hindi
```

### 3. Build for production

```bash
npm run build
```

Builds all locales with AOT, optimization, output hashing, and subresource integrity. Output goes to `dist/`.

For the Docker-ready `/dashboard/<lang>/` directory structure:

```bash
npm run build-dashboard
```

## Project structure

```
src/
  @fuse/                    Fuse template library (components, services, styles, Tailwind plugins)
  app/
    core/                   Auth (guards, interceptors, CSRF), navigation, user, transloco, icons
    layout/                 Shell layouts (dense sidebar is the active default)
    mock-api/               Development-only mock API services
    models/                 TypeScript interfaces
    modules/
      admin/
        dashboard/          Dashboard page + task-details sub-route
        monitoring/         Edge server monitoring page
      auth/                 Auth pages (sign-in, sign-up, sign-out, etc.)
    services/               API services (TrainAnalytics, EdgeMonitoring, Frame, Filter, etc.)
    widgets/                Reusable components (TopBar, Snackbar, PolarAreaChart, BouncyLoader)
  assets/                   Images, icons, fonts
  environments/             Environment configs (dev / prod)
  locale/                   XLF2 translation files (en, ja, hi)
  styles/                   Global SCSS (vendors, custom styles, Tailwind layers)
```

## Key API endpoints

The monitoring page consumes these edge-server endpoints (proxied via `/edge/`):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/system/status` | Full system snapshot (server, RFID, lasers, cameras, services, infrastructure, iDRAC) |
| `POST` | `/api/v1/system/recheck` | Force immediate re-check of all subsystems |
| `GET` | `/api/v1/health` | Lightweight liveness probe (200 = healthy, 503 = degraded) |

The dashboard consumes annotation API endpoints under `/api/custom/` (tasks summary, paginated tasks, task analysis, comments).

## Styling

- **Tailwind CSS 3.3** with `important: true`, class-based dark mode, and custom breakpoints (sm 600, md 960, lg 1280, xl 1440)
- **Angular Material 19** themed via SCSS with Fuse's palette generator
- **Brand colors:** primary `#CD791D` (amber/orange), accent `#185CA7` (blue)
- **Fonts:** Inter var (sans), IBM Plex Mono (mono)
- **6 theme presets:** default, brand (active), teal, rose, purple, amber

## Deployment

### Docker

```bash
docker build -t orochi-ui .
docker run -p 80:80 orochi-ui
```

The Dockerfile uses a two-stage build (Node 20 build + nginx:alpine serve). Nginx handles locale detection from `Accept-Language`, API proxying, and SPA fallback routing under `/dashboard/<lang>/`.

### Kubernetes

A `kubernetes-deployment.yaml` is included with:

- Deployment: 2 replicas, 256-512 Mi memory, 0.2-0.5 CPU, liveness and readiness probes
- Service: LoadBalancer on port 80
- Ingress: nginx ingress class with SSL redirect

## Available scripts

| Script | Description |
|--------|-------------|
| `npm start` | Dev server (English, HMR enabled) |
| `npm run start-ja` | Dev server (Japanese) |
| `npm run start-te` | Dev server (Hindi) |
| `npm run build` | Production build (all locales) |
| `npm run build-dashboard` | Production build with `/dashboard/<lang>/` structure for Docker |
| `npm run translations` | Extract i18n strings to `src/locale/messages.en.xlf2` |
| `npm run xlf-translate` | Auto-translate XLF2 files via Google Cloud Translate |

## Proxy configuration

During development, `proxy.conf.js` forwards these path prefixes to `https://OKKUNsys.tokyu.co.jp/`:

`/api`, `/edge`, `/auth`, `/oauth2`, `/saml2`, `/ui-api`, `/public`, `/management`, `/websocket`, `/login`

## License

Fuse admin template -- licensed via ThemeForest Standard License.
