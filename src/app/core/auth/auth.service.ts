import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

@Injectable({providedIn: 'root'})
export class AuthService
{
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
	private _router = inject(Router);
    private _lastCheckTime: number = 0;
    private readonly CHECK_CACHE_DURATION = 5000; // 5 seconds cache

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any>
    {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any>
    {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
	signIn(credentials: { username: string; password: string }): Observable<any> {
        if (this._authenticated) {
            return throwError(() => new Error('User is already logged in.'));
        }

        return this._httpClient.post(`/api/auth/login`, credentials, {
            withCredentials: true
        }).pipe(
            switchMap(() => {
                return this._httpClient.get(`/api/users/self`, {
                    withCredentials: true
                });
            }),
            tap(user => {
                this._authenticated = true;

                // Store user
                this._userService.user = user;

				console.log(user);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any>
    {
        // Sign in using the token
        return this._httpClient.post('api/auth/sign-in-with-token', {
            accessToken: this.accessToken,
        }).pipe(
            catchError(() =>

                // Return false
                of(false),
            ),
            switchMap((response: any) =>
            {
                // Replace the access token with the new one if it's available on
                // the response object.
                //
                // This is an added optional step for better security. Once you sign
                // in using the token, you should generate a new one on the server
                // side and attach it to the response object. Then the following
                // piece of code can replace the token with the refreshed one.
                if ( response.accessToken )
                {
                    this.accessToken = response.accessToken;
                }

                // Set the authenticated flag to true
                this._authenticated = true;

                // Store the user on the user service
                this._userService.user = response.user;

                // Return true
                return of(true);
            }),
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any>
    {
        return this._httpClient.post(`/api/auth/logout`, {}, {
            withCredentials: true,
            headers: {
                'X-CSRFToken': this.getCookie('csrftoken')
            }
        }).pipe(
            tap(() => {
                this._authenticated = false;
                this._userService.user = null;
                this._router.navigate(['/sign-out']);
            })
        );
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any>
    {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // If we already know user is authenticated, just return true
        if (this._authenticated) {
            return of(true);
        }

        // If we've checked recently and failed, don't check again immediately
        const now = Date.now();
        if (!this._authenticated && (now - this._lastCheckTime) < this.CHECK_CACHE_DURATION) {
            return of(false);
        }

        this._lastCheckTime = now;
        
        // Otherwise, validate session by calling /users/self
        return this._httpClient.get(`/api/users/self`, {
            withCredentials: true
        }).pipe(
            map(() => {
                this._authenticated = true;
                return true;
            }),
            catchError(() => {
                this._authenticated = false;
                return of(false);
            })
        );
    }

    /**
     * Get cookie value
     *
     * @param name
     */
    private getCookie(name: string): string {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return '';
    }
}
