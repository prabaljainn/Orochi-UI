import {
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EdgeMonitoringService } from 'app/services/edge-monitoring.service';
import {
    SystemStatus,
    CameraStatusSummary,
    LaserChannelStatus,
} from 'app/models/monitoring.types';
import {
    Subject,
    interval,
    switchMap,
    takeUntil,
    catchError,
    of,
    tap,
} from 'rxjs';

@Component({
    selector: 'monitoring',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatProgressSpinnerModule,

    ],
    templateUrl: './monitoring.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class MonitoringComponent implements OnInit, OnDestroy {
    title: string = 'Monitoring';

    data: SystemStatus | null = null;
    edgeOffline: boolean = false;
    loading: boolean = false;
    lastSyncedAgo: number = 0;
    lastSyncTimestamp: Date | null = null;

    private destroy$ = new Subject<void>();
    private syncTicker$ = new Subject<void>();

    constructor(private _edgeService: EdgeMonitoringService) {}

    ngOnInit(): void {
        // Initial fetch
        this.fetchStatus();

        // Auto-poll every 60 seconds
        interval(60000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.fetchStatus());

        // Update "last synced X seconds ago" every second
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (this.lastSyncTimestamp) {
                    this.lastSyncedAgo = Math.floor(
                        (Date.now() - this.lastSyncTimestamp.getTime()) / 1000
                    );
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fetchStatus(): void {
        this.loading = true;
        this._edgeService
            .getStatus()
            .pipe(
                catchError((err) => {
                    this.edgeOffline = true;
                    this.loading = false;
                    return of(null);
                })
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                }
                this.loading = false;
                this.lastSyncTimestamp = new Date();
                this.lastSyncedAgo = 0;
            });
    }

    onSync(): void {
        this.loading = true;
        this._edgeService
            .recheck()
            .pipe(
                catchError((err) => {
                    this.edgeOffline = true;
                    this.loading = false;
                    return of(null);
                })
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                }
                this.loading = false;
                this.lastSyncTimestamp = new Date();
                this.lastSyncedAgo = 0;
            });
    }

    // ── Color helpers ──────────────────────────────────────────

    /** Returns 'green' | 'yellow' | 'red' based on standard thresholds */
    pctColor(pct: number, warnAt = 60, critAt = 85): string {
        if (pct >= critAt) return 'red';
        if (pct >= warnAt) return 'yellow';
        return 'green';
    }

    pctBarClass(pct: number, warnAt = 60, critAt = 85): string {
        const c = this.pctColor(pct, warnAt, critAt);
        if (c === 'red') return 'bg-red-500';
        if (c === 'yellow') return 'bg-yellow-500';
        return 'bg-green-500';
    }

    pctTextClass(pct: number, warnAt = 60, critAt = 85): string {
        const c = this.pctColor(pct, warnAt, critAt);
        if (c === 'red') return 'text-red-500';
        if (c === 'yellow') return 'text-yellow-500';
        return 'text-green-500';
    }

    dotClass(online: boolean): string {
        return online ? 'bg-green-500' : 'bg-red-500';
    }

    // ── Formatting helpers ─────────────────────────────────────

    formatSeconds(s: number | null | undefined): string {
        if (s == null) return '--';
        if (s < 60) return `${Math.floor(s)}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
        return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
    }

    timeAgo(seconds: number | null | undefined): string {
        if (seconds == null) return '--';
        if (seconds < 60) return `${Math.floor(seconds)}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
    }

    companyLabel(code: string): string {
        if (code === 'T') return 'Tokyu';
        if (code === 'Y') return 'Yokohama';
        return code;
    }

    formatIsoShort(iso: string | null | undefined): string {
        if (!iso) return '--';
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return iso;
        }
    }

    channelHeartbeatColor(ch: LaserChannelStatus): string {
        if (!ch.connected) return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 30) return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 10) return 'bg-yellow-500';
        return 'bg-green-500';
    }

    cameraCount(status: string): number {
        if (!this.data?.cameras) return 0;
        return this.data.cameras.filter((c) => c.status === status).length;
    }

    allServicesHealthy(): boolean {
        if (!this.data?.services) return false;
        return this.data.services.every((s) => s.healthy);
    }

    allExternalServicesHealthy(): boolean {
        if (!this.data?.external_services) return false;
        return this.data.external_services.every((s) => s.healthy);
    }
}
