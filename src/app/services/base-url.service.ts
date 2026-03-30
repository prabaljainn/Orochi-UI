import { InjectionToken } from '@angular/core';

export const API_BASE_HREF = new InjectionToken<string>('/');

export function getBaseLocation(locale: string): string {
    const path = new URL(document.baseURI);
    return path.pathname;
}

// https://[ip/dns]/[prefix]
export function getApiBase(locale: string): string {
    const path = new URL(document.baseURI);
    const segs = path.pathname.split('/');

    // Check if this is a multi-tenant setup by looking for a tenant identifier
    // If the path contains 'dashboard' as the first segment, it's likely the Angular app route
	// and we should use the root API path
    if (segs.length <= 3 || (segs.length > 1 && segs[1] === 'dashboard')) {
        return '/';
    } else {
        const tenant = segs[1];
        return '/' + tenant + '/';
    }
}
