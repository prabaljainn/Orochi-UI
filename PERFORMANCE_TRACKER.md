# Orochi-UI Performance Tracker

> This document tracks performance issues found during code audits, their status, and remaining work.
> Last updated: **2026-03-30**

---

## Completed Fixes

### Fix #2 — Monitoring Component: OnPush + Pre-computed Values + NgZone [DONE]
- **Files changed:** `monitoring.component.ts`, `monitoring.component.html`
- **Problem:** 27 method calls in template re-evaluated every change detection cycle. A `interval(1000)` triggered full CD every second with `Default` strategy. `ViewEncapsulation.None` leaked styles.
- **Solution:**
  - Added `ChangeDetectionStrategy.OnPush`
  - Removed `ViewEncapsulation.None`
  - All 27 template method calls (`cameraCount()`, `pctTextClass()`, `pctBarClass()`, `dotClass()`, `channelHeartbeatColor()`, `allServicesHealthy()`, `allExternalServicesHealthy()`, `formatSeconds()`, `companyLabel()`, `timeAgo()`, `formatIsoShort()`) replaced with pre-computed class properties updated in `_computeDerivedValues()`
  - 1-second ticker moved to `NgZone.runOutsideAngular()` with targeted `detectChanges()`
  - Added proper `clearInterval()` in `ngOnDestroy`
- **Impact:** ~27 fewer method invocations per CD cycle; CD no longer triggers globally every second

### Fix #3 — Frame Annotator: Pre-computed Shape Props + Fixed @for Track [DONE]
- **Files changed:** `frame-annotator.component.ts`, `frame-annotator.component.html`, `annotation.types.ts`
- **Problem:**
  - `getRectangleProps()` called 6x per rectangle, `getEllipseProps()` 6x per ellipse, `getPointPairs()` generated new array each cycle — all inside `@for` loops
  - All `@for` track expressions used function references (`track trackByShapeId`) instead of property values — Angular always saw the same identity so tracking was broken
  - `CommonModule` imported but only `@if/@for` used (needs no import)
  - `URL.createObjectURL()` never revoked — blob memory leak
  - Multiple `console.log` statements
- **Solution:**
  - Added `rectProps`, `ellipseProps`, `pointPairs` to `ScaledShape` interface — pre-computed during `createScaledShape()`
  - Fixed all `@for` track expressions to `track shape.id`, `track track.id`, `track tag.id`, `track i`
  - Removed `CommonModule` import (not needed for `@if`/`@for` control flow)
  - Added `OnDestroy` with `URL.revokeObjectURL()` cleanup
  - Removed all `console.log` statements
  - Added `ChangeDetectionStrategy.OnPush`
- **Impact:** Eliminated ~20+ method calls per CD cycle in annotation-heavy frames; fixed memory leak

### Fix #4 — Remove Duplicate AuthInterceptor Registration [DONE]
- **Files changed:** `auth.provider.ts`
- **Problem:** `authInterceptor` was registered in both `app.config.ts` (`provideHttpClient(withInterceptors([csrfInterceptor, authInterceptor]))`) and `auth.provider.ts` (`provideHttpClient(withInterceptors([authInterceptor]))`). Every HTTP request passed through `authInterceptor` **twice**.
- **Solution:** Removed `provideHttpClient(withInterceptors([authInterceptor]))` from `auth.provider.ts`
- **Impact:** Halved interceptor overhead on every HTTP request; eliminated conflicting 401 navigation

### Fix #5 — Conditional Mock API in Production [DONE]
- **Files changed:** `app.config.ts`
- **Problem:** 23 mock API services registered unconditionally. The `mockApiInterceptor` scanned every HTTP request against all 23 handlers even in production.
- **Solution:** Wrapped `mockApi` config in `environment.production` check using spread operator
- **Impact:** Eliminated mock API overhead in production; reduced bundle size

### Fix #8 — Lazy-Load Layout Variants [DONE]
- **Files changed:** `layout.component.ts`, `layout.component.html`
- **Problem:** All 10 layout variants eagerly imported in `LayoutComponent`, but only `dense` is used. ~9 unused layout component bundles in initial chunk.
- **Solution:**
  - Only `EmptyLayoutComponent` and `DenseLayoutComponent` eagerly imported (most used)
  - Other 8 layouts wrapped in `@defer` blocks inside `@switch` (replaces 10 `*ngIf` chains)
  - Added `ChangeDetectionStrategy.OnPush`
- **Impact:** Reduced initial bundle by ~8 unused layout component bundles; cleaner template

### Fix #17 — Remove console.log Statements [DONE]
- **Files changed:** `sign-in.component.ts`, `task-details.component.ts`, `dashboard.component.ts`, `comments.component.ts`, `languages.component.ts`, `auth.service.ts`, `base-url.service.ts`, `frame-annotator.component.ts`
- **Problem:** 33 `console.log/warn/error` statements executing in production, including user data logging in `auth.service.ts`
- **Solution:** Removed all non-essential console statements
- **Impact:** Cleaner console; eliminated security risk of logging user data

### Fix #18 — Remove Duplicate API_BASE_HREF Provider [DONE]
- **Files changed:** `app.config.ts`
- **Problem:** `API_BASE_HREF` provided twice — `getBaseLocation` and `getApiBase`. Angular uses last one, first was dead code.
- **Solution:** Removed duplicate `getBaseLocation` provider; kept only `getApiBase`
- **Impact:** Cleaner config; removed dead code confusion

### Fix #19 — Remove Unnecessary Module Imports [DONE]
- **Files changed:** `frame-annotator.component.ts`, `video-grid.component.ts`, `video-player-dialog.component.ts`, `dashboard.component.ts`
- **Problem:**
  - `FrameAnnotatorComponent` imported `CommonModule` but uses only `@if/@for` (no import needed)
  - `VideoGridComponent` imported `CommonModule` (replaced with `NgFor`/`NgIf`) and unused `MatProgressSpinnerModule`
  - `VideoPlayerDialogComponent` imported `CommonModule` (replaced with `NgIf`)
  - `DashboardComponent` imported `MatDatepickerModule` (used in child `TopBarComponent`, not directly)
- **Solution:** Replaced bulk imports with specific directives; removed unused modules; added `OnPush` to video components
- **Impact:** Smaller component bundles; better tree-shaking

### Fix #20-30 — Low Priority Batch [DONE]
- **CSS (Fix #21, #22):** Removed duplicate `-webkit-` keyframe prefixes in `styles.scss` (saved ~50% of animation CSS). Replaced global `*::-webkit-scrollbar { display: none }` with scoped selectors for specific containers (perf + a11y).
- **angular.json (Fix #23):** Tightened bundle budgets from 3MB warn/5MB error to **2.5MB warn/3.5MB error** (realistic for Fuse/Tailwind CSS overhead; current initial total is 2.84MB raw / ~398KB gzipped). Moved `localize: true` from base options to production config only (saves 3x dev build time). Added `subresourceIntegrity: true` for security.
- **package.json (Fix #26, #27):** Moved `@google-cloud/translate` and `xliff` from runtime `dependencies` to `devDependencies` (build-time only tools). Removed unused `liftoff` package.
- **CSRF Interceptor (Fix #30):** Removed `GET` from CSRF token methods — CSRF only needed for state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Preloading (Fix #10):** Uncommented `withPreloading(PreloadAllModules)` in router config for faster subsequent navigation.

---

## Remaining Work (Not Yet Fixed)

### Priority: CRITICAL
| # | Issue | Files | Effort |
|---|-------|-------|--------|
| 1 | **Add OnPush to all 55 remaining components** | All component `.ts` files | 2-3 hours |
| 6 | **Hardcoded credentials** in sign-in form (`admin/admin`) | `sign-in.component.ts:87-88` | 5 min |

### Priority: HIGH
| # | Issue | Files | Effort |
|---|-------|-------|--------|
| 7 | **8+ subscription memory leaks** — `DashboardComponent` (searchInputControl, verdictFilterControl not piped through takeUntil), `TaskDetailsComponent` (no OnDestroy), `TopBarComponent` (no OnDestroy), `PolarAreaChartComponent` (no OnDestroy), `SnackbarComponent` (no OnDestroy), `DenseLayoutComponent` (missing takeUntil on one subscription) | Multiple widget/component files | 2-3 hours |
| 9 | **Zero `shareReplay`/`retry` usage** — no HTTP retry logic, no response caching, `initialDataResolver`'s `forkJoin` has zero `catchError` (single failure blocks entire app) | All service files, `app.resolvers.ts` | 3-4 hours |
| 10 | **~2.9 MB icon SVG sprites** loaded at startup — audit which icons are used, remove unused sprites | `icons.service.ts`, `src/assets/icons/` | 1-2 hours |
| 11 | **Uncleaned setTimeout/setInterval** — dashboard paginator access after destroy, snackbar timers, video-grid detect changes | `dashboard.component.ts`, `snackbar.component.ts`, `video-grid.component.ts` | 1 hour |

### Priority: MEDIUM
| # | Issue | Files | Effort |
|---|-------|-------|--------|
| 12 | Missing error handling in 8+ services (EdgeMonitoring, FrameApi, User, Navigation, Shortcuts, Notifications, Messages, QuickChat) | Service files | 2-3 hours |
| 13 | Auth interceptor conflicting navigation on 401 (`/sign-in` vs `/sign-out`) | `auth.interceptor.ts`, `auth.service.ts` | 30 min |
| 14 | Convert remaining template method calls to pipes: `formatTimeAgo()` in comments, `formatTime()` in video-player-dialog, `getBgColor()` in task-details | Multiple template + pipe files | 1-2 hours |
| 15 | `ViewEncapsulation.None` still on `DashboardComponent` | `dashboard.component.ts` | 15 min |
| 16 | TypeScript `strict` mode disabled in `tsconfig.json` | `tsconfig.json` | 4-8 hours (fixing type errors) |

### Priority: LOW
| # | Issue | Files | Effort |
|---|-------|-------|--------|
| 20 | Unused Fuse demo assets (~560 KB: avatars, UI scenes) | `src/assets/images/avatars/`, `src/assets/images/ui/` | 15 min |
| 24 | `@angular/material-luxon-adapter` version mismatch (v18 with Angular v19) | `package.json` | 5 min |
| 25 | `crypto-js` v3.3.0 outdated — consider Web Crypto API | `package.json`, CSRF service | 2-4 hours |
| 28 | Add CSS `contain` property to perf-critical components | Component SCSS files | 1 hour |
| 29 | Reduce `alert.component.scss` (1,340 lines) with SCSS mixins | `@fuse/components/alert/` | 2 hours |

---

## Performance Metrics Targets

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Initial bundle size | ~5 MB (error limit) | < 3.5 MB error / 2.84 MB actual (398KB gzipped) | Budgets tightened |
| Change detection cycles (monitoring page) | Every 1s globally | Only on data change | Fixed |
| Template method calls (monitoring) | 27 per CD cycle | 0 | Fixed |
| Template method calls (frame-annotator) | 20+ per CD cycle | 0 | Fixed |
| HTTP interceptor passes | 2x (duplicate auth) | 1x | Fixed |
| Mock API overhead in prod | Active (23 handlers) | None | Fixed |
| Layout bundles in initial chunk | 11 (all eagerly loaded) | 2 (rest deferred) | Fixed |
| ObjectURL memory leaks | Growing per frame | Cleaned on destroy | Fixed |
| console.log in production | 33 statements | 0 | Fixed |

---

## How to Use This Tracker

1. **Before starting new work:** Check "Remaining Work" for items you can pick up
2. **After fixing an issue:** Move it from "Remaining" to "Completed" with details
3. **During code review:** Reference this file to ensure fixes aren't reverted
4. **Each sprint:** Pick 2-3 items from "Remaining" based on priority

---

*Generated from comprehensive performance audit on 2026-03-30*
