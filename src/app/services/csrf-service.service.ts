import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsrfService {
    /**
     * Get CSRF token from cookie
     */
    getCsrfToken(): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; csrftoken=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    }

    /**
     * Check if CSRF token exists
     */
    hasCsrfToken(): boolean {
        return !!this.getCsrfToken();
    }
}
