import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_HREF } from './base-url.service';

@Injectable({
    providedIn: 'root',
})
export class TrainAnalyticsService {
    constructor(private http: HttpClient, @Inject(API_BASE_HREF) private baseUrl: string) {}

    getTasksSummary(fromTime: string, toTime: string) {
        const params = new HttpParams()
            .set('from_time', fromTime)
            .set('to_time', toTime);

        return this.http.get(this.baseUrl + 'api/custom/tasks-summary', { params }).pipe(
            catchError((err) => {
                console.error('Error: Failed to get tasks summary', err);
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
        includeAnalytics: boolean = false
    ) {
        const params = new HttpParams()
            .set('page', page)
            .set('page_size', page_size)
            .set('verdict', verdict)
            .set('search', search)
            .set('from_time', fromTime)
            .set('to_time', toTime)
            .set('include_analytics', includeAnalytics);

        return this.http.get(this.baseUrl + 'api/custom/tasks-paginated', { params }).pipe(
            catchError((err) => {
                console.error(
                    'Error: Failed to get train analytics tasks',
                    err
                );
                return throwError(() => err);
            })
        );
    }

    getTaskAnalysis(projectId: string, taskId: string) {
        const params = new HttpParams()
            .set('project_id', projectId)
            .set('task_id', taskId);

        return this.http.get(this.baseUrl + 'api/custom/task-analysis', { params }).pipe(
            catchError((err) => {
                console.error('Error: Failed to get task analysis', err);
                return throwError(() => err);
            })
        );
    }
}
