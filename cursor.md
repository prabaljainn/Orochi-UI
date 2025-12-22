# Cursor Development Log

## URL Structure Implementation: /dashboard/en/ with Angular i18n

**Date**: September 15, 2025  
**Task**: Implement `/dashboard/en/` URL structure with proper Angular i18n support and nginx routing

### Problem Statement
Need to implement a URL structure where:
- `https://sudocodes.com/dashboard/` redirects to `https://sudocodes.com/dashboard/en/`
- The Angular app loads properly at `/dashboard/en/` with full routing support
- Support for multiple languages (en, ja) with proper base href configuration

### Solution Overview
Created a complete solution that includes:
1. **Angular Build Configuration**: Proper base href setup for `/dashboard/en/` structure
2. **Nginx Routing**: Serves Angular app correctly at the new URL structure
3. **Language Support**: Handles multiple languages (en, ja) with proper i18n
4. **Docker Integration**: Updated Dockerfile for containerized deployment
5. **Testing Framework**: Comprehensive testing scripts and validation

### Files Created/Modified

#### 1. nginx-dashboard-structure.conf
- **Purpose**: Nginx configuration for `/dashboard/en/` URL structure with Angular i18n support
- **Key Features**:
  - Dashboard root redirects: `/dashboard` → `/dashboard/en/`
  - Language-specific routing: `/dashboard/(en|ja)/(.*)$`
  - Serves from language-specific build directories: `dashboard-en/`, `dashboard-ja/`
  - Language detection with fallback to English
  - API proxy preservation for `/api/` endpoints
  - Proper static asset handling from language directories

#### 2. build-dashboard-structure.sh
- **Purpose**: Build script for creating Angular app with dashboard structure
- **Features**:
  - Builds each language with correct base href (`/dashboard/en/`, `/dashboard/ja/`)
  - Organizes output into `dashboard-en/` and `dashboard-ja/` directories
  - Validates build structure
  - Automated deployment preparation

#### 3. Dockerfile (Updated)
- **Purpose**: Updated existing Dockerfile to use dashboard structure
- **Features**:
  - Uses the build script for consistent builds
  - Multi-stage build with correct base href for each language
  - Proper directory structure for nginx serving
  - Uses the new nginx configuration

#### 4. test-dashboard-structure.sh
- **Purpose**: Comprehensive test script for dashboard structure validation
- **Features**:
  - Nginx configuration syntax validation
  - URL routing tests for all patterns
  - Build structure verification
  - Docker deployment testing instructions
  - Accept-Language header testing

#### 5. package.json (Updated)
- **Added Scripts**:
  - `build-dashboard`: Runs the dashboard structure build
  - `test-dashboard`: Runs the comprehensive test suite

### Key Configuration Changes

#### Angular Build Configuration
```bash
# Build each language with correct base href
ng build --configuration production --localize=en --base-href="/dashboard/en/" --deploy-url="/dashboard/en/"
ng build --configuration production --localize=ja --base-href="/dashboard/ja/" --deploy-url="/dashboard/ja/"
```

#### Nginx URL Pattern Matching
```nginx
# Dashboard root redirects
location = /dashboard {
    return 302 $scheme://$host/dashboard/$accept_language/;
}

# Language-specific dashboard routing
location ~ ^/dashboard/(en|ja)/(.*)$ {
    set $language $1;
    set $path $2;
    try_files /dashboard-$language/$path /dashboard-$language/index.html?$args;
}

# Static assets from language directories
location ~* ^/dashboard/(en|ja)/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    rewrite ^/dashboard/(en|ja)/(.*)$ /dashboard-$1/$2 last;
}
```

#### Directory Structure
```
dist/orochi-ui/
└── dashboard/
    ├── en/                # English build with base href="/dashboard/en/"
    │   ├── index.html
    │   ├── main.js
    │   └── assets/
    ├── ja/                # Japanese build with base href="/dashboard/ja/"
    │   ├── index.html
    │   ├── main.js
    │   └── assets/
    └── [other languages]/
```

### Testing Strategy
1. **Syntax Validation**: Nginx configuration syntax check
2. **URL Routing Tests**: Automated testing of all URL patterns
3. **Language Detection**: Testing Accept-Language header handling
4. **Backwards Compatibility**: Verification of legacy URL redirections
5. **API Preservation**: Ensuring API endpoints remain unaffected

### Deployment Instructions

#### Option 1: Using Build Script (Recommended)
```bash
# 1. Build the Angular app with dashboard structure
npm run build-dashboard

# 2. Deploy nginx configuration
cp nginx-dashboard-structure.conf /etc/nginx/nginx.conf

# 3. Copy built files to web server
cp -r dist/orochi-ui/* /usr/share/nginx/html/

# 4. Restart nginx
nginx -s reload

# 5. Test the deployment
npm run test-dashboard
```

#### Option 2: Using Docker
```bash
# 1. Build the Docker image (uses updated Dockerfile)
docker build -t orochi-ui-dashboard .

# 2. Run the container
docker run -p 80:80 orochi-ui-dashboard

# 3. Test the deployment
curl -I http://localhost/dashboard
curl -I http://localhost/dashboard/en/
```

#### Option 3: Manual Build
```bash
# 1. Build each language separately
ng build --configuration production --localize=en --base-href="/dashboard/en/" --deploy-url="/dashboard/en/"
ng build --configuration production --localize=ja --base-href="/dashboard/ja/" --deploy-url="/dashboard/ja/"

# 2. Organize the build output
mkdir -p dist/orochi-ui/dashboard-en
mkdir -p dist/orochi-ui/dashboard-ja
mv dist/orochi-ui/en/* dist/orochi-ui/dashboard-en/
mv dist/orochi-ui/ja/* dist/orochi-ui/dashboard-ja/

# 3. Deploy as above
```

### Quality Assurance
- **SOLID Principles**: Single responsibility for each location block
- **Maintainability**: Clear comments and logical structure
- **Industry Standards**: Following nginx best practices for URL routing
- **Error Handling**: Proper fallbacks and error responses
- **Performance**: Efficient regex patterns and caching headers

### Expected Behavior After Deployment
- ✅ `https://sudocodes.com/dashboard` → `https://sudocodes.com/dashboard/en/`
- ✅ `https://sudocodes.com/dashboard/en/` → Angular app loads with proper routing
- ✅ `https://sudocodes.com/dashboard/ja/` → Japanese version loads correctly
- ✅ All Angular routes work within `/dashboard/en/` base path
- ✅ API endpoints continue to work unchanged at `/api/*`
- ✅ Static assets load from correct language directories
- ✅ Language detection based on browser `Accept-Language` header
- ✅ Fallback to English for unsupported languages
- ✅ Proper caching headers for performance optimization

### Implementation Summary
This solution provides a complete implementation of the `/dashboard/en/` URL structure with:

1. **Correct Angular Configuration**: Each language build has the proper base href
2. **Nginx Routing**: Serves the correct build for each language path
3. **Language Support**: Handles en/ja languages with proper i18n
4. **Performance**: Optimized static asset serving and caching
5. **Docker Support**: **Container**-ready deployment configuration
6. **PREFIX Support**: Flexible deployment with configurable PREFIX (like GCS project)

### NEW: PREFIX-Based Routing (Like GCS Project)

Added support for PREFIX-based routing similar to the GCS project:

#### Features:
- **Flexible URL Structure**: `BASE/PREFIX/dashboard/en/` (e.g., `BASE/orochi/dashboard/en/`)
- **Environment Variable Control**: Set `PREFIX` environment variable
- **BOX Mode**: Enable with `BOX=true` for PREFIX routing
- **Backward Compatibility**: Still supports `/dashboard/en/` without PREFIX

#### Usage Examples:

```bash
# Standard deployment (without PREFIX) - DEFAULT BEHAVIOR
docker run -p 80:80 orochi-ui
# URLs: http://localhost/dashboard/en/

# PREFIX deployment (like GCS) - requires BOX=true
docker run -e BOX=true -e PREFIX=orochi -p 80:80 orochi-ui
# URLs: http://localhost/orochi/dashboard/en/

# Custom PREFIX
docker run -e BOX=true -e PREFIX=myapp -p 80:80 orochi-ui
# URLs: http://localhost/myapp/dashboard/en/

# BOX mode with default PREFIX (if PREFIX not specified)
docker run -e BOX=true -p 80:80 orochi-ui
# URLs: http://localhost/orochi/dashboard/en/
```

#### Build Commands:

```bash
# Standard dashboard build (/dashboard/en/)
npm run build-dashboard

# PREFIX build (default: "orochi") (/orochi/dashboard/en/)
npm run build-prefix

# Custom PREFIX build
./build-prefix-structure.sh myapp    # /myapp/dashboard/en/
./build-prefix-structure.sh dashboard # /dashboard/en/ (no PREFIX)
```

#### Files Cleaned Up:
- ✅ Removed `nginx.conf` (old configuration)
- ✅ Removed `build-dashboard-structure.sh` (replaced by flexible build-prefix-structure.sh)
- ✅ Removed `nginx/box.conf` (replaced by nginx/orochi-box.conf)
- ✅ Removed `nginx/vars.json.template` (unused)
- ✅ Consolidated build scripts into single flexible solution

The implementation follows industry best practices, maintains SOLID principles, and provides maximum flexibility for different deployment scenarios.

---

## Comprehensive Code Review: Performance & Styling Recommendations

**Date**: December 21, 2025  
**Task**: Extensive code review focusing on performance optimizations and styling improvements

### Executive Summary

After a thorough review of the Orochi UI codebase, I've identified several performance bottlenecks, code quality issues, and styling improvements. The application is well-structured using Angular 19 with Material Design and Tailwind CSS, but there are opportunities for optimization.

---

## 🚀 Performance Issues & Fixes

### 1. **Large Bundle Size (HIGH PRIORITY)**

**Current State:**
- Initial bundle: **3.41 MB** (raw) / **478 KB** (transfer)
- main.js: 1.87 MB
- styles.css: 1.45 MB

**Recommendations:**

```typescript
// app.config.ts - Enable preloading for faster navigation
import { PreloadAllModules } from '@angular/router';

provideRouter(
    appRoutes,
    withPreloading(PreloadAllModules),  // Currently commented out - ENABLE THIS
    withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
),
```

**Additional bundle optimizations in angular.json:**
```json
{
    "budgets": [
        {
            "type": "initial",
            "maximumWarning": "2mb",  // Reduce from 3mb
            "maximumError": "3mb"     // Reduce from 5mb
        }
    ]
}
```

---

### 2. **Memory Leaks - Missing Unsubscribe (HIGH PRIORITY)**

**Issue in `polar-area-chart.component.ts`:**
```typescript
// ❌ CURRENT - No unsubscribe
ngOnInit(): void {
    this._fuseConfigService.config$.subscribe((config) => {
        this.isDarkMode.set(config.scheme === 'dark');
        this._changeDetectorRef.detectChanges();
    });
}
```

**✅ FIX:**
```typescript
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class PolarAreaChartComponent {
    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this._fuseConfigService.config$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((config) => {
                this.isDarkMode.set(config.scheme === 'dark');
                this._changeDetectorRef.detectChanges();
            });
    }
}
```

**Issue in `snackbar.component.ts`:**
```typescript
// ❌ CURRENT - No unsubscribe
ngOnInit(): void {
    this._dataService.currentMessage$.subscribe((res: any) => { ... });
}
```

**✅ FIX:**
```typescript
export class SnackbarComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this._dataService.currentMessage$
            .pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => { ... });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
```

---

### 3. **Console.log Statements in Production (MEDIUM PRIORITY)**

Remove all console.log statements before production:

| File | Line | Statement |
|------|------|-----------|
| `auth.service.ts` | 82 | `console.log(user);` |
| `frame-annotator.component.ts` | 50-53, 155-158, 180-185 | Multiple debug logs |
| `task-details.component.ts` | 113, 546 | Debug logs |
| `comments.component.ts` | 88 | `console.log(this.comments());` |
| `video-grid.component.ts` | 265, 373, 434 | Play error logs |

**✅ FIX - Create a logger service:**
```typescript
// src/app/services/logger.service.ts
import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
    log(...args: any[]): void {
        if (isDevMode()) {
            console.log(...args);
        }
    }

    error(...args: any[]): void {
        if (isDevMode()) {
            console.error(...args);
        }
    }
}
```

---

### 4. **Excessive Change Detection (MEDIUM PRIORITY)**

**Issue in `dashboard.component.ts`:**
```typescript
// ❌ Multiple setTimeout + detectChanges calls
setTimeout(() => {
    let totalTasks = res?.analytics?.summary?.total_tasks || 0;
    this.paginator.length = totalTasks;
    this._cdr.detectChanges();
}, 100);
```

**✅ FIX - Use OnPush change detection:**
```typescript
@Component({
    selector: 'dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,  // Add this
    ...
})
export class DashboardComponent {
    // Convert to signals for better reactivity
    verdictInfo = signal({
        total: 0,
        accepted: 0,
        rejected: 0,
        notAnnotated: 0,
    });
}
```

---

### 5. **Problematic Map Key (MEDIUM PRIORITY)**

**Issue in `dashboard.component.ts`:**
```typescript
// ❌ Objects as Map keys don't work by value equality
taskAndProjectIdToTrainDateTimeMap: Map<
    { taskId: string; projectId: string },
    string
> = new Map();
```

**✅ FIX:**
```typescript
// Use a composite string key instead
taskAndProjectIdToTrainDateTimeMap: Map<string, string> = new Map();

// When setting:
const key = `${result.task_id}_${result.project_id}`;
this.taskAndProjectIdToTrainDateTimeMap.set(key, trainDateTime);

// When getting:
const key = `${taskId}_${projectId}`;
const value = this.taskAndProjectIdToTrainDateTimeMap.get(key);
```

---

### 6. **Duplicate Provider (LOW PRIORITY)**

**Issue in `app.config.ts`:**
```typescript
// ❌ Two providers for the same token - second one wins
{ provide: API_BASE_HREF, useFactory: getBaseLocation },
{ provide: API_BASE_HREF, useFactory: getApiBase },  // This overwrites the first
```

**✅ FIX - Remove duplicate:**
```typescript
// Keep only one
{ provide: API_BASE_HREF, useFactory: getApiBase },
```

---

### 7. **CSRF Interceptor Issue (LOW PRIORITY)**

**Issue in `csrf.interceptor.ts`:**
```typescript
// ❌ GET requests don't need CSRF tokens
const needsCsrfToken = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(
    req.method.toUpperCase()
);
```

**✅ FIX:**
```typescript
// GET requests are safe - remove from list
const needsCsrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    req.method.toUpperCase()
);
```

---

### 8. **Missing trackBy in Tables (LOW PRIORITY)**

**Issue in `dashboard.component.html`:**
```html
<!-- ❌ No trackBy - causes unnecessary re-renders -->
<tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
```

**✅ FIX:**
```html
<tr mat-row *matRowDef="let row; columns: displayedColumns; trackBy: trackByTaskId"></tr>
```

```typescript
// In dashboard.component.ts
trackByTaskId(index: number, task: TaskElement): string {
    return task.taskId;
}
```

---

## 🎨 Styling Issues & Improvements

### 1. **Build Warnings - Empty CSS Selectors (HIGH PRIORITY)**

The build shows 8 CSS rules with empty sub-selectors in dark theme. These are in the Angular Material overrides.

**Location:** `src/@fuse/styles/overrides/angular-material.scss`

**Issue:**
```scss
// These selectors have line breaks causing "Empty sub-selector" warnings
.dark 
.mat-mdc-form-field.mat-form-field-appearance-fill ...
```

**✅ FIX:** Remove line breaks in selectors or fix the syntax.

---

### 2. **Hidden Scrollbars - Accessibility Concern (MEDIUM PRIORITY)**

**Issue in `styles.scss`:**
```scss
// ❌ This hides scrollbars which can harm accessibility
*::-webkit-scrollbar {
    display: none;
}
```

**✅ FIX - Use a more accessible approach:**
```scss
// Show scrollbars only on hover for better UX
*::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

*::-webkit-scrollbar-track {
    background: transparent;
}

*::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
        background-color: rgba(0, 0, 0, 0.4);
    }
}

.dark *::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.4);
    }
}
```

---

### 3. **Inline Styles in HTML (MEDIUM PRIORITY)**

**Issue in `sign-in.component.html`:**
```html
<!-- ❌ Multiple inline <style> tags -->
<style>
    .glow-overlay { ... }
    @keyframes breathe { ... }
</style>
```

**✅ FIX - Move to component SCSS file:**
```scss
// sign-in.component.scss
:host {
    .glow-overlay {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        animation: breathe 4s ease-in-out infinite;
    }

    @keyframes breathe {
        0%, 100% {
            box-shadow: inset 0 0 10px 0px var(--login-glow-color, #412515);
        }
        50% {
            box-shadow: inset 0 0 400px 15px var(--login-glow-color, #412515);
        }
    }

    .animate-fadeIn {
        animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
}
```

---

### 4. **Hardcoded Colors (LOW PRIORITY)**

**Issue:** Colors like `#412515` should be CSS variables for theming consistency.

**✅ FIX - Add to tailwind.config.js:**
```javascript
// tailwind.config.js
const customPalettes = {
    brandPrimary: generatePalette('#CD791D'),
    brandAccent: generatePalette('#185CA7'),
    loginGlow: '#412515',  // Add this
};

// In your styles, use:
// Tailwind: bg-[var(--login-glow)]
// CSS: var(--login-glow-color)
```

---

### 5. **Typography - Sora Font Loading (LOW PRIORITY)**

**Current:** Loading from Google Fonts with potential FOUT (Flash of Unstyled Text)

**✅ FIX - Add font-display:**
```html
<!-- index.html -->
<link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Sora:wght@400;700&display=swap"
    rel="stylesheet">
```

Consider self-hosting fonts for better performance:
```css
@font-face {
    font-family: 'Sora';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/assets/fonts/sora/sora-regular.woff2') format('woff2');
}
```

---

## 🔧 Code Quality Improvements

### 1. **Use Typed Forms (RECOMMENDED)**

**Current:**
```typescript
signInForm: UntypedFormGroup;
```

**✅ FIX:**
```typescript
interface SignInForm {
    username: FormControl<string>;
    password: FormControl<string>;
    rememberMe: FormControl<boolean>;
}

signInForm = new FormGroup<SignInForm>({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true }),
});
```

---

### 2. **Use Angular 19 Signal-based APIs**

Leverage Angular 19's signal-based features more:

```typescript
// Instead of BehaviorSubject + Observable
private _fontSize = new BehaviorSubject<'normal' | 'large' | 'xl'>('normal');
get fontSize$(): Observable<'normal' | 'large' | 'xl'> {
    return this._fontSize.asObservable();
}

// ✅ Use signals
fontSize = signal<'normal' | 'large' | 'xl'>('normal');
```

---

### 3. **Add Error Boundaries for Better UX**

Create a global error handler:

```typescript
// src/app/core/error-handler/global-error-handler.ts
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private dataService: DataService) {}

    handleError(error: any): void {
        console.error('Global error:', error);
        
        this.dataService.changeMessage({
            id: MessageIds.SNACKBAR_TRIGGERED,
            data: {
                type: 'error',
                title: 'An error occurred',
                description: 'Please try again or contact support.',
            },
        });
    }
}

// In app.config.ts
{ provide: ErrorHandler, useClass: GlobalErrorHandler }
```

---

## 📊 Summary of Recommendations

| Priority | Category | Issue | Impact |
|----------|----------|-------|--------|
| 🔴 High | Performance | Enable PreloadAllModules | Faster navigation |
| 🔴 High | Performance | Fix memory leaks (unsubscribe) | Prevents memory issues |
| 🔴 High | Styling | Fix empty CSS selectors | Cleaner build |
| 🟡 Medium | Performance | Remove console.logs | Smaller bundle, security |
| 🟡 Medium | Performance | Use OnPush change detection | Better performance |
| 🟡 Medium | Performance | Fix Map with object keys | Correct behavior |
| 🟡 Medium | Styling | Hidden scrollbars accessibility | Better UX |
| 🟡 Medium | Styling | Move inline styles to SCSS | Maintainability |
| 🟢 Low | Code Quality | Use typed forms | Type safety |
| 🟢 Low | Performance | Fix duplicate provider | Clean config |
| 🟢 Low | Performance | Fix CSRF interceptor | Correct behavior |
| 🟢 Low | Performance | Add trackBy to tables | Better performance |

---

## ✅ What's Working Well

1. **Modern Angular 19** - Using latest Angular features including signals
2. **Clean component architecture** - Standalone components with proper separation
3. **Good theming system** - Fuse theme with Tailwind CSS integration
4. **Proper lazy loading** - Routes are lazy loaded
5. **Beautiful login page** - The breathing glow effect is visually appealing
6. **Responsive design** - Good mobile responsiveness
7. **i18n support** - Internationalization is properly implemented
8. **TypeScript signals** - Good use of Angular signals for state management

---

## 🚧 Implementation Priority

1. **Week 1:** Fix memory leaks and enable PreloadAllModules
2. **Week 2:** Remove console.logs and fix CSS warnings
3. **Week 3:** Implement OnPush change detection
4. **Week 4:** Code quality improvements (typed forms, error handling)

This review maintains the existing functionality while significantly improving performance and maintainability.

---

## 🎬 Video Chunk Caching Enhancement Strategy

**Date**: December 23, 2025  
**Task**: Comprehensive video caching strategy to avoid re-fetching buffered chunks

### Current State Analysis

After reviewing the video components, here's what's happening:

1. **Video Grid (`video-grid.component.ts`)**: Displays 6 videos per page with presigned URLs
2. **Video Player Dialog (`video-player-dialog.component.ts`)**: Full-screen player with zoom/pan/minimap
3. **Videos use presigned S3/GCS URLs** with expiration tokens
4. **No client-side caching mechanism** - each page change or replay refetches from network
5. **Videos have `preload="metadata"` in grid and `preload="auto"` in dialog**

### 🚀 Recommended Caching Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Video Caching Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ LRU Memory   │ → │ IndexedDB    │ → │ Network (S3/GCS) │    │
│  │ Cache (Hot)  │   │ (Warm Cache) │   │ (Cold - Fallback)│    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│        ↑                  ↑                    ↑                │
│   Immediate           Persistent          Presigned URL        │
│   (Current page)      (Cross-session)     (Original source)    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Implementation Plan

#### 1. **Create Video Cache Service (`video-cache.service.ts`)**

```typescript
// src/app/services/video-cache.service.ts
import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VideoCacheDB extends DBSchema {
    videos: {
        key: string; // video key/filename
        value: {
            key: string;
            blob: Blob;
            url: string;         // Original presigned URL (for validation)
            cachedAt: number;    // Timestamp
            expiresAt: number;   // When presigned URL expires
            size: number;        // Blob size in bytes
            lastAccessed: number; // For LRU eviction
        };
        indexes: {
            'by-lastAccessed': number;
            'by-cachedAt': number;
        };
    };
    metadata: {
        key: string;
        value: {
            totalSize: number;
            videoCount: number;
        };
    };
}

@Injectable({ providedIn: 'root' })
export class VideoCacheService {
    private db: IDBPDatabase<VideoCacheDB> | null = null;
    private memoryCache = new Map<string, { blob: Blob; objectUrl: string }>();
    
    // Configuration
    private readonly MAX_MEMORY_CACHE_SIZE = 100 * 1024 * 1024; // 100MB in memory
    private readonly MAX_IDB_CACHE_SIZE = 500 * 1024 * 1024;    // 500MB in IndexedDB
    private readonly MAX_VIDEO_COUNT = 50;                       // Max videos to cache
    
    private currentMemorySize = 0;

    async initDB(): Promise<void> {
        if (this.db) return;
        
        this.db = await openDB<VideoCacheDB>('video-cache', 1, {
            upgrade(db) {
                const videoStore = db.createObjectStore('videos', { keyPath: 'key' });
                videoStore.createIndex('by-lastAccessed', 'lastAccessed');
                videoStore.createIndex('by-cachedAt', 'cachedAt');
                
                db.createObjectStore('metadata', { keyPath: 'key' });
            },
        });
    }

    /**
     * Get video from cache (memory first, then IndexedDB, then fetch)
     */
    async getVideo(videoKey: string, presignedUrl: string): Promise<string> {
        await this.initDB();
        
        // 1. Check memory cache (fastest)
        const memoryHit = this.memoryCache.get(videoKey);
        if (memoryHit) {
            console.debug('[Cache] Memory HIT:', videoKey);
            return memoryHit.objectUrl;
        }
        
        // 2. Check IndexedDB (persistent cache)
        const idbEntry = await this.db?.get('videos', videoKey);
        if (idbEntry && !this.isExpired(idbEntry)) {
            console.debug('[Cache] IndexedDB HIT:', videoKey);
            
            // Promote to memory cache
            const objectUrl = URL.createObjectURL(idbEntry.blob);
            this.addToMemoryCache(videoKey, idbEntry.blob, objectUrl);
            
            // Update last accessed time
            await this.updateLastAccessed(videoKey);
            
            return objectUrl;
        }
        
        // 3. Fetch from network
        console.debug('[Cache] MISS - Fetching:', videoKey);
        return this.fetchAndCache(videoKey, presignedUrl);
    }

    /**
     * Fetch video and store in both caches
     */
    private async fetchAndCache(videoKey: string, presignedUrl: string): Promise<string> {
        const response = await fetch(presignedUrl);
        if (!response.ok) throw new Error(`Failed to fetch video: ${response.status}`);
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Calculate expiration from URL or default to 1 hour
        const expiresAt = this.extractExpiration(presignedUrl) || (Date.now() + 3600000);
        
        // Store in memory cache
        this.addToMemoryCache(videoKey, blob, objectUrl);
        
        // Store in IndexedDB (async, don't await)
        this.storeInIDB(videoKey, blob, presignedUrl, expiresAt);
        
        return objectUrl;
    }

    /**
     * Add to memory cache with LRU eviction
     */
    private addToMemoryCache(key: string, blob: Blob, objectUrl: string): void {
        // Evict if necessary
        while (this.currentMemorySize + blob.size > this.MAX_MEMORY_CACHE_SIZE) {
            const oldest = this.memoryCache.keys().next().value;
            if (oldest) {
                const entry = this.memoryCache.get(oldest);
                if (entry) {
                    URL.revokeObjectURL(entry.objectUrl);
                    this.currentMemorySize -= entry.blob.size;
                }
                this.memoryCache.delete(oldest);
            } else {
                break;
            }
        }
        
        this.memoryCache.set(key, { blob, objectUrl });
        this.currentMemorySize += blob.size;
    }

    /**
     * Store in IndexedDB with size management
     */
    private async storeInIDB(
        key: string, 
        blob: Blob, 
        url: string, 
        expiresAt: number
    ): Promise<void> {
        if (!this.db) return;
        
        try {
            // Check and evict if necessary
            await this.evictIDBIfNeeded(blob.size);
            
            await this.db.put('videos', {
                key,
                blob,
                url,
                cachedAt: Date.now(),
                expiresAt,
                size: blob.size,
                lastAccessed: Date.now(),
            });
            
            await this.updateMetadata();
        } catch (error) {
            console.warn('[Cache] Failed to store in IndexedDB:', error);
        }
    }

    /**
     * Evict oldest entries if cache is full
     */
    private async evictIDBIfNeeded(newSize: number): Promise<void> {
        if (!this.db) return;
        
        const metadata = await this.db.get('metadata', 'stats');
        const currentSize = metadata?.totalSize || 0;
        
        if (currentSize + newSize > this.MAX_IDB_CACHE_SIZE) {
            // Get oldest entries by lastAccessed
            const tx = this.db.transaction('videos', 'readwrite');
            const index = tx.store.index('by-lastAccessed');
            
            let cursor = await index.openCursor();
            let freedSpace = 0;
            const targetFree = newSize + (this.MAX_IDB_CACHE_SIZE * 0.2); // Free 20% extra
            
            while (cursor && freedSpace < targetFree) {
                freedSpace += cursor.value.size;
                await cursor.delete();
                cursor = await cursor.continue();
            }
            
            await tx.done;
        }
    }

    /**
     * Preload videos for upcoming page
     */
    async preloadVideos(videos: { key: string; presigned_url: string }[]): Promise<void> {
        // Preload in background without blocking
        videos.forEach(async (video) => {
            try {
                await this.getVideo(video.key, video.presigned_url);
            } catch (error) {
                console.debug('[Cache] Preload failed:', video.key, error);
            }
        });
    }

    /**
     * Clear expired entries
     */
    async clearExpired(): Promise<void> {
        if (!this.db) return;
        
        const tx = this.db.transaction('videos', 'readwrite');
        const store = tx.store;
        
        let cursor = await store.openCursor();
        while (cursor) {
            if (this.isExpired(cursor.value)) {
                await cursor.delete();
            }
            cursor = await cursor.continue();
        }
        
        await tx.done;
        await this.updateMetadata();
    }

    /**
     * Check if cache entry is expired
     */
    private isExpired(entry: { expiresAt: number }): boolean {
        return Date.now() > entry.expiresAt;
    }

    /**
     * Extract expiration time from presigned URL
     */
    private extractExpiration(url: string): number | null {
        try {
            const urlObj = new URL(url);
            
            // AWS S3 style: X-Amz-Expires (seconds from signature)
            const amzExpires = urlObj.searchParams.get('X-Amz-Expires');
            const amzDate = urlObj.searchParams.get('X-Amz-Date');
            if (amzExpires && amzDate) {
                const signedAt = new Date(
                    amzDate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, 
                    '$1-$2-$3T$4:$5:$6Z')
                ).getTime();
                return signedAt + (parseInt(amzExpires) * 1000);
            }
            
            // GCS style: Expires (Unix timestamp)
            const gcsExpires = urlObj.searchParams.get('Expires');
            if (gcsExpires) {
                return parseInt(gcsExpires) * 1000;
            }
            
            return null;
        } catch {
            return null;
        }
    }

    private async updateLastAccessed(key: string): Promise<void> {
        if (!this.db) return;
        
        const entry = await this.db.get('videos', key);
        if (entry) {
            entry.lastAccessed = Date.now();
            await this.db.put('videos', entry);
        }
    }

    private async updateMetadata(): Promise<void> {
        if (!this.db) return;
        
        const tx = this.db.transaction('videos', 'readonly');
        let totalSize = 0;
        let videoCount = 0;
        
        let cursor = await tx.store.openCursor();
        while (cursor) {
            totalSize += cursor.value.size;
            videoCount++;
            cursor = await cursor.continue();
        }
        
        await this.db.put('metadata', {
            key: 'stats',
            totalSize,
            videoCount,
        });
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{
        memorySize: number;
        memoryCacheCount: number;
        idbSize: number;
        idbCount: number;
    }> {
        await this.initDB();
        const metadata = await this.db?.get('metadata', 'stats');
        
        return {
            memorySize: this.currentMemorySize,
            memoryCacheCount: this.memoryCache.size,
            idbSize: metadata?.totalSize || 0,
            idbCount: metadata?.videoCount || 0,
        };
    }

    /**
     * Clear all caches
     */
    async clearAll(): Promise<void> {
        // Clear memory cache
        this.memoryCache.forEach((entry) => URL.revokeObjectURL(entry.objectUrl));
        this.memoryCache.clear();
        this.currentMemorySize = 0;
        
        // Clear IndexedDB
        if (this.db) {
            await this.db.clear('videos');
            await this.db.put('metadata', { key: 'stats', totalSize: 0, videoCount: 0 });
        }
    }
}
```

---

#### 2. **Update Video Grid Component to Use Cache**

```typescript
// video-grid.component.ts - Updated
import { VideoCacheService } from 'app/services/video-cache.service';

export class VideoGridComponent implements AfterViewInit, OnChanges, OnDestroy {
    private videoCacheService = inject(VideoCacheService);
    
    // Store cached URLs
    cachedUrlsOnPage: Map<string, string> = new Map();
    
    private async updateSafeUrlsForPage() {
        const start = this.currentPage * this.pageSize;
        const pageItems = (this.videos || []).slice(start, start + this.pageSize);

        this.loadedVideoIndices.clear();
        this.areAllVideosLoaded = pageItems.length === 0;
        
        // Load videos through cache
        const cachedUrls = await Promise.all(
            pageItems.map(async (v) => {
                const cachedUrl = await this.videoCacheService.getVideo(
                    v.key, 
                    v.presigned_url
                );
                this.cachedUrlsOnPage.set(v.key, cachedUrl);
                return cachedUrl;
            })
        );

        this.safeUrlsOnPage = cachedUrls.map((url) =>
            this.sanitizer.bypassSecurityTrustResourceUrl(url)
        );

        // Preload next page
        this.preloadNextPage();

        if (this.areAllVideosLoaded) {
            setTimeout(() => this.cd.detectChanges(), 0);
        }
    }

    private preloadNextPage(): void {
        if (this.currentPage + 1 >= this.totalPages) return;
        
        const nextStart = (this.currentPage + 1) * this.pageSize;
        const nextPageItems = this.videos.slice(nextStart, nextStart + this.pageSize);
        
        // Preload in background
        this.videoCacheService.preloadVideos(nextPageItems);
    }
    
    ngOnDestroy() {
        this.stopProgressLoop();
        // Don't revoke URLs - they're managed by the cache service
    }
}
```

---

#### 3. **Service Worker Strategy (Alternative/Complementary)**

```typescript
// ngsw-config.json - Add to your Angular service worker config
{
  "dataGroups": [
    {
      "name": "video-cache",
      "urls": [
        "https://*.s3.*.amazonaws.com/**",
        "https://storage.googleapis.com/**"
      ],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "10s"
      }
    }
  ]
}
```

**Note:** Service Workers don't work well with presigned URLs that change. The IndexedDB approach above is recommended.

---

#### 4. **Range Request Support for Large Videos**

For very large videos, implement HTTP Range requests to cache specific chunks:

```typescript
// video-chunk-cache.service.ts
interface VideoChunk {
    videoKey: string;
    startByte: number;
    endByte: number;
    data: ArrayBuffer;
    cachedAt: number;
}

@Injectable({ providedIn: 'root' })
export class VideoChunkCacheService {
    private chunkCache = new Map<string, VideoChunk[]>();
    private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

    /**
     * Get buffered ranges for a video
     */
    getBufferedRanges(videoKey: string): { start: number; end: number }[] {
        const chunks = this.chunkCache.get(videoKey) || [];
        return this.mergeRanges(chunks.map(c => ({ start: c.startByte, end: c.endByte })));
    }

    /**
     * Check if range is already cached
     */
    isRangeCached(videoKey: string, start: number, end: number): boolean {
        const ranges = this.getBufferedRanges(videoKey);
        return ranges.some(r => r.start <= start && r.end >= end);
    }

    /**
     * Fetch only missing chunks
     */
    async fetchMissingRange(
        videoKey: string,
        presignedUrl: string,
        start: number,
        end: number
    ): Promise<ArrayBuffer> {
        const cachedChunks = this.chunkCache.get(videoKey) || [];
        const cachedRanges = this.getBufferedRanges(videoKey);
        
        // Find gaps in cache
        const gaps = this.findGaps(cachedRanges, start, end);
        
        if (gaps.length === 0) {
            // Fully cached - return from cache
            return this.assembleFromCache(videoKey, start, end);
        }
        
        // Fetch only missing parts
        const fetchPromises = gaps.map(gap => 
            this.fetchRange(videoKey, presignedUrl, gap.start, gap.end)
        );
        
        await Promise.all(fetchPromises);
        return this.assembleFromCache(videoKey, start, end);
    }

    private async fetchRange(
        videoKey: string,
        url: string,
        start: number,
        end: number
    ): Promise<void> {
        const response = await fetch(url, {
            headers: { Range: `bytes=${start}-${end}` }
        });
        
        if (!response.ok && response.status !== 206) {
            throw new Error(`Range request failed: ${response.status}`);
        }
        
        const data = await response.arrayBuffer();
        
        if (!this.chunkCache.has(videoKey)) {
            this.chunkCache.set(videoKey, []);
        }
        
        this.chunkCache.get(videoKey)!.push({
            videoKey,
            startByte: start,
            endByte: start + data.byteLength - 1,
            data,
            cachedAt: Date.now(),
        });
    }

    private findGaps(
        cachedRanges: { start: number; end: number }[],
        requestStart: number,
        requestEnd: number
    ): { start: number; end: number }[] {
        const gaps: { start: number; end: number }[] = [];
        let currentStart = requestStart;
        
        for (const range of cachedRanges.sort((a, b) => a.start - b.start)) {
            if (range.start > currentStart) {
                gaps.push({ start: currentStart, end: Math.min(range.start - 1, requestEnd) });
            }
            currentStart = Math.max(currentStart, range.end + 1);
            if (currentStart > requestEnd) break;
        }
        
        if (currentStart <= requestEnd) {
            gaps.push({ start: currentStart, end: requestEnd });
        }
        
        return gaps;
    }

    private mergeRanges(ranges: { start: number; end: number }[]): { start: number; end: number }[] {
        if (ranges.length === 0) return [];
        
        const sorted = [...ranges].sort((a, b) => a.start - b.start);
        const merged: { start: number; end: number }[] = [sorted[0]];
        
        for (let i = 1; i < sorted.length; i++) {
            const last = merged[merged.length - 1];
            const current = sorted[i];
            
            if (current.start <= last.end + 1) {
                last.end = Math.max(last.end, current.end);
            } else {
                merged.push(current);
            }
        }
        
        return merged;
    }

    private assembleFromCache(videoKey: string, start: number, end: number): ArrayBuffer {
        const chunks = this.chunkCache.get(videoKey) || [];
        const relevantChunks = chunks
            .filter(c => c.endByte >= start && c.startByte <= end)
            .sort((a, b) => a.startByte - b.startByte);
        
        const totalSize = end - start + 1;
        const result = new Uint8Array(totalSize);
        
        for (const chunk of relevantChunks) {
            const chunkStart = Math.max(chunk.startByte, start);
            const chunkEnd = Math.min(chunk.endByte, end);
            const sourceStart = chunkStart - chunk.startByte;
            const destStart = chunkStart - start;
            const length = chunkEnd - chunkStart + 1;
            
            result.set(
                new Uint8Array(chunk.data, sourceStart, length),
                destStart
            );
        }
        
        return result.buffer;
    }
}
```

---

#### 5. **MediaSource API for Advanced Streaming**

For the most control over video buffering, use the MediaSource API:

```typescript
// video-stream.service.ts
@Injectable({ providedIn: 'root' })
export class VideoStreamService {
    private mediaSource: MediaSource | null = null;
    private sourceBuffer: SourceBuffer | null = null;

    async createBufferedVideoUrl(
        videoKey: string,
        presignedUrl: string,
        videoCacheService: VideoCacheService
    ): Promise<string> {
        this.mediaSource = new MediaSource();
        const objectUrl = URL.createObjectURL(this.mediaSource);

        this.mediaSource.addEventListener('sourceopen', async () => {
            const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
            
            if (!MediaSource.isTypeSupported(mimeType)) {
                console.warn('MIME type not supported, falling back');
                return presignedUrl;
            }

            this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType);
            
            // Fetch and append initial chunk
            const response = await fetch(presignedUrl, {
                headers: { Range: 'bytes=0-5242879' } // First 5MB
            });
            
            const data = await response.arrayBuffer();
            this.sourceBuffer.appendBuffer(data);
            
            // Store in cache
            videoCacheService.storeChunk(videoKey, 0, data);
        });

        return objectUrl;
    }

    /**
     * Load more data when video seeks or buffer runs low
     */
    async loadMoreData(
        videoKey: string,
        presignedUrl: string,
        currentTime: number,
        duration: number,
        videoCacheService: VideoCacheService
    ): Promise<void> {
        if (!this.sourceBuffer || this.sourceBuffer.updating) return;

        const buffered = this.sourceBuffer.buffered;
        const bufferAhead = 10; // Seconds to buffer ahead
        
        // Check if we need more data
        let needsMore = true;
        for (let i = 0; i < buffered.length; i++) {
            if (buffered.start(i) <= currentTime && 
                buffered.end(i) >= currentTime + bufferAhead) {
                needsMore = false;
                break;
            }
        }

        if (needsMore) {
            const startByte = this.timeToBytes(currentTime, duration);
            const endByte = startByte + 5 * 1024 * 1024; // 5MB chunk
            
            // Try cache first
            const cachedData = await videoCacheService.getChunk(videoKey, startByte);
            
            if (cachedData) {
                this.sourceBuffer.appendBuffer(cachedData);
            } else {
                const response = await fetch(presignedUrl, {
                    headers: { Range: `bytes=${startByte}-${endByte}` }
                });
                const data = await response.arrayBuffer();
                this.sourceBuffer.appendBuffer(data);
                videoCacheService.storeChunk(videoKey, startByte, data);
            }
        }
    }

    private timeToBytes(time: number, duration: number): number {
        // Approximate - would need actual video size
        const estimatedBitrate = 5 * 1024 * 1024; // 5 Mbps
        return Math.floor(time / duration * estimatedBitrate * duration / 8);
    }
}
```

---

### 📊 Cache Strategy Summary

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **IndexedDB (Recommended)** | Persistent, large storage, works offline | Async, needs management | Your current use case |
| **Memory LRU Cache** | Fastest access, instant | Lost on page refresh, limited size | Hot videos (current page) |
| **Service Worker** | Automatic, network intercept | Poor with presigned URLs | Static assets only |
| **Range Requests** | Granular control, saves bandwidth | Complex implementation | Very large videos |
| **MediaSource API** | Full buffer control, HLS-like | Complex, codec-specific | Advanced streaming |

---

### 🎯 Implementation Priority

1. **Phase 1 (Immediate)**: Implement `VideoCacheService` with IndexedDB + Memory LRU
2. **Phase 2 (Next Sprint)**: Add next-page preloading
3. **Phase 3 (Future)**: Consider Range Requests for very large videos
4. **Phase 4 (If needed)**: MediaSource API for HLS-like control

---

### 📦 Dependencies to Add

```bash
# For IndexedDB wrapper
npm install idb

# Optional: For better LRU implementation
npm install lru-cache
```

---

### 💡 Quick Wins (No New Dependencies)

If you want to start with minimal changes:

```typescript
// Simple in-memory cache - add to video-grid.component.ts
private blobCache = new Map<string, string>(); // key -> objectUrl

private async getCachedUrl(video: VideoItem): Promise<string> {
    const cached = this.blobCache.get(video.key);
    if (cached) return cached;
    
    const response = await fetch(video.presigned_url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    this.blobCache.set(video.key, objectUrl);
    return objectUrl;
}

// Call in updateSafeUrlsForPage()
const urls = await Promise.all(pageItems.map(v => this.getCachedUrl(v)));
```

This simple approach will already prevent re-fetching when navigating back to previously viewed pages within the same session.
