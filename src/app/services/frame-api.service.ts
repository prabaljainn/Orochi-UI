import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FrameData } from 'app/models/annotation.types';
import { API_BASE_HREF } from './base-url.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FrameApiService {
    constructor(
        private http: HttpClient,
        @Inject(API_BASE_HREF) private baseUrl: string
    ) {}

    getFrameImageUrl(
        jobId: number,
        frameNumber: number,
        type: string = 'frame',
        quality: string = 'compressed'
    ) {
        return this.http.get(
            `/api/jobs/${jobId}/data?number=${frameNumber.toString()}&type=${type}&quality=${quality}&org=`,
            {
                withCredentials: true,
                responseType: 'blob',
            }
        );
    }

    getMeta(job_id: number, frame_number: number): Observable<FrameData> {
        return this.http.get<FrameData>(
            `/api/custom/jobs/${job_id}/frame/${frame_number}`
        );
    }
}
