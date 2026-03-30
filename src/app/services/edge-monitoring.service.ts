import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemStatus, HealthCheckResponse } from 'app/models/monitoring.types';

const BASE = '/edge/api/v1';

@Injectable({
    providedIn: 'root',
})
export class EdgeMonitoringService {
    constructor(private _http: HttpClient) {}

    /** Full system status snapshot. */
    getStatus(): Observable<SystemStatus> {
        return this._http.get<SystemStatus>(`${BASE}/system/status`);
    }

    /** Force an immediate re-check of all subsystems. */
    recheck(): Observable<SystemStatus> {
        return this._http.post<SystemStatus>(`${BASE}/system/recheck`, null);
    }

    /** Lightweight liveness probe. */
    getHealth(): Observable<HealthCheckResponse> {
        return this._http.get<HealthCheckResponse>(`${BASE}/health`);
    }
}
