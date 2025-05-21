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
    console.log('[base-url]: ', segs);
    if (segs.length <= 3) {
        console.log('[base-url] not on prem');
        return '/';
    } else {
        console.log('[base-url] on prem');
        const tenant = segs[1];
        return '/' + tenant + '/';
    }
}
