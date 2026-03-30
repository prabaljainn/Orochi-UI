import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemStatus } from 'app/models/monitoring.types';

const STATUS_URL = '/edge/api/v1/system/status';

@Injectable({
    providedIn: 'root',
})
export class EdgeMonitoringService {
    constructor(private _http: HttpClient) {}

    getStatus(): Observable<SystemStatus> {
        return this._http.get<SystemStatus>(STATUS_URL);
    }

    recheck(): Observable<SystemStatus> {
        return this._http.get<SystemStatus>(STATUS_URL);
    }
}
