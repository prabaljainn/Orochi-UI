import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Clone the request and include credentials (cookies)
    const newReq = req.clone({
        withCredentials: true
    });

    return next(newReq).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                // User is not authenticated - redirect to login
                authService.signOut(); // optional: clear state
                router.navigate(['/sign-in']); // or your login route
            }

            return throwError(() => error);
        })
    );
};