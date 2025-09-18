import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TrainAnalyticsService {
    constructor(private http: HttpClient) {}

    getTasksSummary(fromTime: string, toTime: string) {
        const params = new HttpParams()
            .set('from_time', fromTime)
            .set('to_time', toTime);

        return this.http.get('/api/custom/tasks-summary', { params }).pipe(
            catchError((err) => {
                console.error(
                    'Error: Failed to get tasks summary',
                    err
                );
                return throwError(() => err);
            })
        );
    }

    getTasks(
        page: number,
        page_size: number,
		fromTime: string,
        toTime: string,
        verdict: string,
        search: string,
		include_analytics: boolean = false
    ) {
		const params = new HttpParams()
            .set('page', page)
            .set('page_size', page_size)
            .set('verdict', verdict)
            .set('search', search)
            .set('from_time', fromTime)
            .set('to_time', toTime);

        return this.http.get('/api/custom/tasks-paginated', { params }).pipe(
            catchError((err) => {
                console.error('Error: Failed to get train analytics tasks', err);
                return throwError(() => err);
            })
        );
	}
}
