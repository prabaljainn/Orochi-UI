# Orochi-UI — Architecture Document

**Status:** Accepted
**Date:** 2026-03-31
**Application:** Open Data Annotation Platform
**Framework:** Angular 19 (Standalone Components)
**UI Kit:** Fuse Enterprise Template + Angular Material 19 + Tailwind CSS 3

---

## Context

Orochi-UI is the frontend for the **Open Data Annotation Platform** — an enterprise system for reviewing, annotating, and quality-checking visual data (image frames from video/camera feeds). It supports multi-tenant deployments, multi-language interfaces, and real-time edge-hardware monitoring. The platform is used by annotation teams to inspect frame-level data, render shape overlays (bounding boxes, polygons, ellipses), manage task workflows with verdict-based QA, and monitor the health of physical capture infrastructure (cameras, RFID readers, laser sensors, servers).

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (SPA)                            │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  Auth     │  │  Dashboard   │  │  Monitoring               │ │
│  │  Module   │  │  Module      │  │  Module                   │ │
│  │          │  │  ┌──────────┐│  │  (Edge Server, RFID,      │ │
│  │ sign-in  │  │  │Task List ││  │   Laser, Cameras,         │ │
│  │ sign-up  │  │  │Task Detail││  │   Containers, iDRAC)      │ │
│  │ reset-pw │  │  │Frame Ann.││  │                           │ │
│  │ etc.     │  │  │Video Grid││  └───────────────────────────┘ │
│  └──────────┘  │  │Comments  ││                                 │
│                │  └──────────┘│                                 │
│                └──────────────┘                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Fuse Layout System                     │  │
│  │  (Dense/Classic/Compact + Nav + Messages + Notifications)│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Core Services Layer                    │  │
│  │  AuthService · UserService · NavigationService           │  │
│  │  TrainAnalyticsService · FrameApiService · FilterService │  │
│  │  EdgeMonitoringService · FontSizeService · DataService   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                HTTP Interceptor Chain                     │  │
│  │  CSRF Interceptor → Auth Interceptor → Loading Bar       │  │
│  │  (+ Mock API Interceptor in dev mode)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Backend APIs       │
                    │                     │
                    │ /api/auth/*         │
                    │ /api/users/*        │
                    │ /api/common/*       │
                    │ /api/custom/*       │
                    │ /api/jobs/*         │
                    │ /api/apps/*         │
                    │ /edge/api/v1/*      │
                    └────────────────────┘
```

---

## Directory Structure

```
src/
├── @fuse/                      # Fuse UI framework (vendored)
│   ├── components/             # Alert, Card, Drawer, Navigation, LoadingBar, Masonry, Highlight
│   ├── directives/             # ScrollReset, Scrollbar
│   ├── lib/mock-api/           # Dev-only mock HTTP interceptor
│   ├── pipes/                  # FindByKey pipe
│   ├── services/               # Config, Loading, Confirmation, Media Watcher, Platform, Splash Screen, Utils
│   └── styles/                 # Tailwind base, theme SCSS, vendor overrides
│
├── app/
│   ├── core/                   # Singleton services bootstrapped once
│   │   ├── auth/               # AuthService, guards (AuthGuard, NoAuthGuard), interceptors (auth, csrf), provider
│   │   ├── icons/              # Material + custom icon registration
│   │   ├── navigation/         # NavigationService + types
│   │   ├── transloco/          # HTTP loader for translation files
│   │   └── user/               # UserService + User type
│   │
│   ├── models/                 # Shared TypeScript interfaces
│   │   ├── annotation.types.ts # FrameData, Shape, ScaledShape, Track, Tag, Label, TaskDetails
│   │   ├── common.types.ts     # SnackbarType, TaskElement, TaskComment, CommentType, VerdictMap
│   │   └── monitoring.types.ts # SystemStatus, EdgeServerInfo, RfidStatus, LaserStatus, CameraStatus, etc.
│   │
│   ├── modules/
│   │   ├── auth/               # 7 auth page components (sign-in, sign-up, forgot-password, etc.)
│   │   ├── admin/
│   │   │   ├── dashboard/      # Main feature — task list, task-details, frame-annotator, comments, video-grid
│   │   │   └── monitoring/     # Edge system monitoring dashboard
│   │   └── landing/            # Home page (currently disabled in routes)
│   │
│   ├── services/               # Feature services
│   │   ├── base-url.service.ts        # Multi-tenant API base URL resolution
│   │   ├── train-analytics.service.ts # Task summary, paginated tasks, task analysis, comments CRUD
│   │   ├── frame-api.service.ts       # Frame image blobs + frame metadata
│   │   ├── edge-monitoring.service.ts # Edge server status, recheck, health probe
│   │   ├── filter.service.ts          # BehaviorSubject-based filter state with sessionStorage
│   │   ├── data.service.ts            # Snackbar event bus
│   │   ├── font-size.service.ts       # User font-size preference (localStorage)
│   │   └── csrf-service.service.ts    # Cookie-based CSRF token extraction
│   │
│   ├── widgets/                # Reusable presentational components
│   │   ├── snackbar/           # Toast notification bar
│   │   ├── top-bar/            # Top navigation bar
│   │   ├── bouncy-loader/      # Loading animation
│   │   └── polar-area-chart/   # Verdict analytics chart (ApexCharts)
│   │
│   ├── layout/                 # Layout shell system
│   │   ├── layout.component.ts # Master layout with theme/scheme switching
│   │   ├── common/             # Messages, Notifications, Quick Chat, Shortcuts, User menu, Search, Settings, Languages
│   │   └── layouts/            # 11 layout variants (6 vertical + 4 horizontal + 1 empty)
│   │
│   ├── mock-api/               # 23 mock API handlers (dev only)
│   ├── app.component.ts        # Root component (RouterOutlet + Snackbar)
│   ├── app.config.ts           # Application providers (HTTP, Router, Material, Transloco, Fuse, MockAPI)
│   ├── app.routes.ts           # Route definitions with guards and lazy loading
│   └── app.resolvers.ts        # initialDataResolver (navigation, messages, notifications, chat, shortcuts)
│
├── assets/                     # Static assets (images, icons, favicons)
├── environments/               # environment.ts / environment.prod.ts
├── locale/                     # Generated XLF2 translation files
└── styles/                     # Global SCSS entry points
```

---

## Routing & Navigation

| Path | Guard | Layout | Module | Description |
|------|-------|--------|--------|-------------|
| `/` | — | — | Redirect → `/dashboard` | Root redirect |
| `/sign-in` | NoAuthGuard | Empty | Auth | Login page |
| `/sign-up` | NoAuthGuard | Empty | Auth | Registration |
| `/forgot-password` | NoAuthGuard | Empty | Auth | Password reset request |
| `/reset-password` | NoAuthGuard | Empty | Auth | Set new password |
| `/confirmation-required` | NoAuthGuard | Empty | Auth | Email confirmation |
| `/sign-out` | AuthGuard | Empty | Auth | Logout handler |
| `/unlock-session` | AuthGuard | Empty | Auth | Session unlock |
| `/dashboard` | AuthGuard | Dense | Admin/Dashboard | Task list + analytics |
| `/dashboard/task-details/:projectId/:taskId` | AuthGuard | Dense | Admin/Dashboard | Frame annotation + comments |
| `/monitoring` | AuthGuard | Dense | Admin/Monitoring | Edge system health |

All feature routes are **lazy-loaded** via dynamic imports. The router uses `PreloadAllModules` strategy to background-preload after initial load, with in-memory scroll position restoration.

The `initialDataResolver` runs before any AuthGuard-protected route renders, preloading navigation structure, messages, notifications, quick-chat conversations, and shortcuts via `forkJoin`.

---

## Authentication & Security

The auth system is **session/cookie-based** with CSRF protection:

1. **Sign-in flow:** `POST /api/auth/login` → on success → `GET /api/users/self` (with credentials) → store user in `UserService` → navigate to `/dashboard`
2. **Token support:** Access tokens stored in `localStorage` for optional token-based auth (`POST /api/auth/sign-in-with-token`)
3. **Auth check caching:** `AuthService.check()` caches the result for 5 seconds to avoid excessive server roundtrips on route transitions
4. **CSRF protection:** `csrfInterceptor` extracts `csrftoken` from `document.cookie` and attaches `X-CSRFToken` header to all POST/PUT/PATCH/DELETE requests
5. **401 handling:** `authInterceptor` catches 401 responses, signs the user out, and redirects to `/sign-in`
6. **Guards:** `AuthGuard` redirects unauthenticated users to `/sign-in?redirectURL=...`; `NoAuthGuard` redirects authenticated users away from guest-only pages

---

## State Management

The project uses **RxJS observables** (no NgRx/Akita/Signals store):

| Service | Pattern | Scope |
|---------|---------|-------|
| UserService | `ReplaySubject<User>(1)` | Global — current user |
| NavigationService | `ReplaySubject<Navigation>(1)` | Global — sidebar menu |
| MessagesService | `ReplaySubject<Message[]>(1)` | Global — inbox |
| NotificationsService | `ReplaySubject<Notification[]>(1)` | Global — alerts |
| ShortcutsService | `ReplaySubject<Shortcut[]>(1)` | Global — quick actions |
| FilterService | `Map<string, BehaviorSubject<GenericFilters>>` | Per-key — dashboard filters (persisted to sessionStorage) |
| FontSizeService | `BehaviorSubject<'normal'\|'large'\|'xl'>` | Global — accessibility preference (persisted to localStorage) |
| DataService | `BehaviorSubject<{id, data}>` | Global — snackbar event bus |
| FuseConfigService | `BehaviorSubject<any>` | Global — theme/layout config |
| QuickChatService | `BehaviorSubject<Chat/Chat[]>` | Global — chat sidebar |
| AuthService | Boolean flag + timestamp cache | Global — auth status |

---

## API Surface

### Core Platform APIs (proxied to backend)

| Service | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Auth | POST | `/api/auth/login` | Authenticate user |
| Auth | GET | `/api/users/self` | Get current user (session) |
| Auth | POST | `/api/auth/logout?org=` | End session |
| Auth | POST | `/api/auth/sign-up` | Register new user |
| Auth | POST | `/api/auth/password/reset?org=` | Request password reset |
| Auth | POST | `/api/auth/reset-password` | Set new password |
| User | GET | `api/common/user` | Fetch user profile |
| User | PATCH | `api/common/user` | Update user profile |
| Navigation | GET | `api/common/navigation` | Sidebar menu structure |
| Messages | CRUD | `api/common/messages` | Inbox messages |
| Notifications | CRUD | `api/common/notifications` | Alert notifications |
| Shortcuts | CRUD | `api/common/shortcuts` | Quick-action shortcuts |
| Chat | GET | `api/apps/chat/chats` | Chat conversations |

### Annotation & Analytics APIs

| Service | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Analytics | GET | `api/custom/tasks-summary` | Aggregate task statistics (accepted/rejected/not-annotated) |
| Analytics | GET | `api/custom/tasks-paginated` | Paginated task list with filters |
| Analytics | GET | `api/custom/task-analysis` | Detailed task analysis |
| Comments | GET | `api/custom/tasks/{id}/comments/?org=` | Task discussion thread |
| Comments | POST | `api/custom/task-comments/create/?org=` | Add comment |
| Comments | DELETE | `api/custom/comments/{id}` | Remove comment |
| Frames | GET | `api/jobs/{jobId}/data?number=&type=&quality=` | Frame image (blob) |
| Frames | GET | `api/custom/jobs/{id}/frame/{num}` | Frame annotation metadata |

### Edge Monitoring APIs

| Service | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| Monitoring | GET | `/edge/api/v1/system/status` | Full system snapshot (server, RFID, laser, cameras, containers, iDRAC) |
| Monitoring | POST | `/edge/api/v1/system/recheck` | Force subsystem re-check |
| Monitoring | GET | `/edge/api/v1/health` | Lightweight liveness probe |

### Multi-Tenant URL Resolution

The `API_BASE_HREF` injection token resolves the API prefix dynamically:
- URL contains `/dashboard` at root → base = `/`
- URL contains `/{tenant}/dashboard` → base = `/{tenant}/`

---

## Core Domain Models

### Annotation Domain
- **FrameData** — Frame metadata with job_id, frame_number, annotations array
- **Shape** — Annotation primitive: rectangle, polygon, polyline, points, ellipse, cuboid, mask, skeleton (with points, z_order, rotation, occluded flag)
- **ScaledShape** — Rendering-optimized Shape with pre-computed `scaledPoints`, `svgPath`, `rectProps`, `ellipseProps`, `color`
- **Track** — Object tracked across frames (track_id + shapes)
- **Label** — Annotation label definition with per-type counts
- **TaskDetails** — Task metadata: project, owner, assignee, dates, frame ranges, status

### Task/QA Domain
- **TaskElement** — Row in the task list: projectId, taskId, trainId, status, verdict, annotation stats
- **VerdictMap** — AC (Accepted), RJ (Rejected), NA (Not Annotated)
- **CommentType** — GEN (General), ISS (Issue), Q (Question), FB (Feedback), REV (Review), Note
- **TaskComment** — Threaded comment with author, timestamps, replies

### Monitoring Domain
- **SystemStatus** — Full snapshot: edge_server, rfid, laser_sensors, cameras, services, infrastructure, idrac, containers
- **EdgeServerInfo** — Host metrics (hostname, uptime, CPU%, memory, disk[])
- **RfidStatus** — Reader state + last tag info
- **LaserStatus** — Dual-channel (DI0, DI2) with active session tracking
- **CameraStatusSummary** — Per-camera health
- **InfrastructureDevice** — Network devices (switch, router, io_module, serial_bridge, server_mgmt)
- **ContainerStatus** — Docker container health
- **IdracStatus** — Dell iDRAC hardware management data

---

## Performance Optimizations

Documented in `PERFORMANCE_TRACKER.md`:

1. **OnPush change detection** on monitoring and annotation components to minimize re-renders
2. **Pre-computed template properties** — `ScaledShape` pre-calculates `rectProps`, `ellipseProps`, `svgPath` to avoid per-cycle template computation
3. **Proper `@for` tracking** — using entity IDs instead of function references
4. **NgZone.runOutsideAngular** — 1-second monitoring ticker runs outside Angular's zone to avoid triggering change detection
5. **Conditional mock API** — mock services excluded entirely from production bundles
6. **Blob URL cleanup** — `URL.revokeObjectURL()` prevents memory leaks in frame/video rendering
7. **Lazy-loaded routes** with `PreloadAllModules` for fast initial load + background preloading
8. **Budget limits** — 2.5MB warning / 3.5MB error for initial bundle; 75KB per component stylesheet

---

## Internationalization (i18n)

Two complementary systems:

1. **Transloco** (runtime) — English + Turkish, HTTP-loaded JSON translation files, language switching without reload
2. **Angular i18n** (build-time) — `$localize` tagged templates compiled into locale-specific builds:
   - `/dashboard/en/` — English
   - `/dashboard/ja/` — Japanese
   - `/dashboard/hi/` — Hindi
   - XLF2 format, extracted via `ng extract-i18n`

---

## Theming & Layout System

**Fuse framework** provides 11 layout variants (6 vertical, 4 horizontal, 1 empty) selectable at runtime via `FuseConfigService`. The active layout is `dense` (compact sidebar).

**6 color themes:** Default, Brand, Teal, Rose, Purple, Amber — switchable via settings panel.

**Scheme:** Light/Dark mode with OS media-query auto-detection.

**Responsive breakpoints:** sm (600px), md (960px), lg (1280px), xl (1440px).

**Font sizing:** 3-tier accessibility preference (normal / large / xl) persisted to localStorage.

---

## Build & Deployment

| Concern | Tooling |
|---------|---------|
| Build | Angular CLI (`ng build`) with 5GB Node heap |
| Containerization | Multi-stage Dockerfile (build → nginx) |
| Orchestration | docker-compose.yml + kubernetes-deployment.yaml |
| Reverse Proxy | Nginx with language-aware routing (`/dashboard/{lang}/`) |
| CI/CD | Bitbucket Pipelines (`bitbucket-pipelines.yml`) |
| Static Hosting | Netlify-compatible (`_redirects` file in assets) |

Production build: optimizations enabled, source maps disabled, subresource integrity, license extraction, named chunks disabled.

---

## Key Dependencies

| Package | Version | Role |
|---------|---------|------|
| @angular/* | 19.0.0 | Core framework |
| @angular/material | 19.0.0 | UI component library |
| @ngneat/transloco | 6.0.0 | Runtime i18n |
| rxjs | 7.8.1 | Reactive state & async |
| luxon | 3.4.4 | Date/time (Material adapter) |
| apexcharts / ng-apexcharts | 3.44.0 / 1.8.0 | Charts (verdict polar area) |
| ngx-quill / quill | 24.0.2 / 1.3.7 | Rich text editing |
| highlight.js | 11.9.0 | Code syntax highlighting |
| crypto-js | 3.3.0 | Cryptographic utilities |
| perfect-scrollbar | 1.5.5 | Custom scrollbars |
| lodash-es | 4.17.21 | Utility functions |
| tailwindcss | 3.3.5 | Utility-first CSS |

---

## Component Count Summary

| Category | Count |
|----------|-------|
| Feature components (auth + admin) | 15 |
| Layout components | 21 |
| Common layout components | 8 |
| Widget components | 4 |
| Fuse framework components | 19 |
| Services (app + core + layout) | ~20 |
| Interceptors | 4 |
| Guards | 2 |
| Pipes | 1 |
| Directives | 2 |
| Mock API handlers | 23 |
| **Total** | **~119 artifacts** |

---

## Architecture Decisions

### AD-1: Standalone Components over NgModules
Angular 19 standalone component architecture — no `NgModule` declarations. Components import their dependencies directly. This eliminates module boilerplate and improves tree-shaking.

### AD-2: RxJS Subjects over NgRx
Lightweight observable state with `ReplaySubject`/`BehaviorSubject` per service rather than a centralized store. Appropriate for the app's scope where most state is server-driven and ephemeral.

### AD-3: Fuse as Layout Framework
Vendored Fuse template (`src/@fuse/`) provides navigation, theming, confirmation dialogs, loading bars, and 11 layout shells. Trades customization freedom for rapid enterprise UI scaffolding.

### AD-4: Session-Based Auth with CSRF
Cookie/session auth with `withCredentials: true` and `X-CSRFToken` headers. Chosen over pure JWT for compatibility with the Django-style backend (CVAT/custom API).

### AD-5: Dual i18n Strategy
Transloco for runtime language switching (settings panel) combined with Angular's build-time i18n for locale-specific deployments. Supports both use cases: quick toggling for dev, and optimized locale bundles for production.

### AD-6: Multi-Tenant URL Resolution
Dynamic `API_BASE_HREF` token inspects the browser URL to determine tenant context, enabling a single Angular build to serve multiple tenants behind different URL prefixes.
