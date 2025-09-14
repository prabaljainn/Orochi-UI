import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from 'app/services/csrf-service.service';
import { Observable } from 'rxjs';

export const csrfInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    // Only add CSRF token for state-changing methods
    const needsCsrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        req.method.toUpperCase()
    );

    const csrfService = inject(CsrfService);

    if (needsCsrfToken) {
        const csrfToken = csrfService.getCsrfToken();

        if (csrfToken) {
            const csrfReq = req.clone({
                headers: req.headers
                    .set('X-CSRFToken', csrfToken)
                    .set('Referer', window.location.origin),
            });
            return next(csrfReq);
        }
    }

    return next(req);
};
