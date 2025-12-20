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
