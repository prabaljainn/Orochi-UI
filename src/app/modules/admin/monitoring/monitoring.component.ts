import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    NgZone,
    OnDestroy,
    OnInit,
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
    LaserChannelStatus,
} from 'app/models/monitoring.types';
import {
    Subject,
    interval,
    takeUntil,
    catchError,
    of,
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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringComponent implements OnInit, OnDestroy {
    title: string = 'Monitoring';

    data: SystemStatus | null = null;
    edgeOffline: boolean = false;
    loading: boolean = false;
    lastSyncedAgo: number = 0;
    lastSyncTimestamp: Date | null = null;

    // Pre-computed template values (avoid method calls in template)
    onlineCameraCount: number = 0;
    offlineCameraCount: number = 0;
    servicesHealthy: boolean = false;
    externalServicesHealthy: boolean = false;

    // Pre-computed resource classes
    cpuTextClass: string = 'text-green-500';
    cpuBarClass: string = 'bg-green-500';
    memoryTextClass: string = 'text-green-500';
    memoryBarClass: string = 'bg-green-500';
    diskRootTextClass: string = 'text-green-500';
    diskRootBarClass: string = 'bg-green-500';
    diskDataTextClass: string = 'text-green-500';
    diskDataBarClass: string = 'bg-green-500';

    // Pre-computed RFID/laser values
    rfidCompanyLabel: string = '';
    rfidTimeAgo: string = '';
    rfidUptimeFormatted: string = '';
    channelDI0Color: string = 'bg-red-500';
    channelDI2Color: string = 'bg-red-500';
    lastSessionStart: string = '--';
    lastSessionEnd: string = '--';

    // Pre-computed camera summary class
    cameraSummaryDotClass: string = 'bg-emerald-500';

    private destroy$ = new Subject<void>();
    private tickerInterval: any = null;

    constructor(
        private _edgeService: EdgeMonitoringService,
        private _cdr: ChangeDetectorRef,
        private _ngZone: NgZone
    ) {}

    ngOnInit(): void {
        // Initial fetch
        this.fetchStatus();

        // Auto-poll every 60 seconds
        interval(60000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.fetchStatus());

        // Run the 1-second tick OUTSIDE Angular zone to avoid triggering
        // change detection across the entire app every second
        this._ngZone.runOutsideAngular(() => {
            this.tickerInterval = setInterval(() => {
                if (this.lastSyncTimestamp) {
                    this.lastSyncedAgo = Math.floor(
                        (Date.now() - this.lastSyncTimestamp.getTime()) / 1000
                    );
                    // Only mark this component for check
                    this._cdr.detectChanges();
                }
            }, 1000);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
        }
    }

    fetchStatus(): void {
        this.loading = true;
        this._cdr.markForCheck();
        this._edgeService
            .getStatus()
            .pipe(
                catchError((err) => {
                    this.edgeOffline = true;
                    this.loading = false;
                    this._cdr.markForCheck();
                    return of(null);
                })
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                    this._computeDerivedValues();
                }
                this.loading = false;
                this.lastSyncTimestamp = new Date();
                this.lastSyncedAgo = 0;
                this._cdr.markForCheck();
            });
    }

    onSync(): void {
        this.loading = true;
        this._cdr.markForCheck();
        this._edgeService
            .recheck()
            .pipe(
                catchError((err) => {
                    this.edgeOffline = true;
                    this.loading = false;
                    this._cdr.markForCheck();
                    return of(null);
                })
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                    this._computeDerivedValues();
                }
                this.loading = false;
                this.lastSyncTimestamp = new Date();
                this.lastSyncedAgo = 0;
                this._cdr.markForCheck();
            });
    }

    // ── Pre-compute all derived values on data change ──────────
    private _computeDerivedValues(): void {
        if (!this.data) return;

        // Camera counts
        this.onlineCameraCount = this.data.cameras?.filter(c => c.status === 'online').length ?? 0;
        this.offlineCameraCount = this.data.cameras?.filter(c => c.status === 'offline').length ?? 0;

        // Camera summary dot
        if (this.offlineCameraCount === 0) {
            this.cameraSummaryDotClass = 'bg-emerald-500';
        } else if (this.onlineCameraCount === 0) {
            this.cameraSummaryDotClass = 'bg-red-500';
        } else {
            this.cameraSummaryDotClass = 'bg-amber-500';
        }

        // Services health
        this.servicesHealthy = this.data.services?.every(s => s.healthy) ?? false;
        this.externalServicesHealthy = this.data.external_services?.every(s => s.healthy) ?? false;

        // Resource classes
        this.cpuTextClass = this._pctTextClass(this.data.edge_server.cpu_pct);
        this.cpuBarClass = this._pctBarClass(this.data.edge_server.cpu_pct);
        this.memoryTextClass = this._pctTextClass(this.data.edge_server.memory_pct, 70, 85);
        this.memoryBarClass = this._pctBarClass(this.data.edge_server.memory_pct, 70, 85);
        this.diskRootTextClass = this._pctTextClass(this.data.edge_server.disk_root_pct, 70, 85);
        this.diskRootBarClass = this._pctBarClass(this.data.edge_server.disk_root_pct, 70, 85);
        this.diskDataTextClass = this._pctTextClass(this.data.edge_server.disk_data_pct, 70, 85);
        this.diskDataBarClass = this._pctBarClass(this.data.edge_server.disk_data_pct, 70, 85);

        // RFID
        if (this.data.rfid?.last_tag) {
            this.rfidCompanyLabel = this._companyLabel(this.data.rfid.last_tag.company);
            this.rfidTimeAgo = this._timeAgo(this.data.rfid.seconds_since_last_tag);
        }
        this.rfidUptimeFormatted = this.data.rfid?.heartbeat
            ? this._formatSeconds(this.data.rfid.heartbeat.uptime_s)
            : '--';

        // Laser channels
        if (this.data.laser_sensors?.channels) {
            this.channelDI0Color = this._channelHeartbeatColor(this.data.laser_sensors.channels.DI0);
            this.channelDI2Color = this._channelHeartbeatColor(this.data.laser_sensors.channels.DI2);
        }
        if (this.data.laser_sensors?.last_session) {
            this.lastSessionStart = this._formatIsoShort(this.data.laser_sensors.last_session.start_time);
            this.lastSessionEnd = this._formatIsoShort(this.data.laser_sensors.last_session.end_time);
        }
    }

    /** Dot class for camera/service status indicators */
    dotClass(online: boolean): string {
        return online ? 'bg-green-500' : 'bg-red-500';
    }

    // ── Private formatting helpers (called only from _computeDerivedValues) ──

    private _pctColor(pct: number, warnAt = 60, critAt = 85): string {
        if (pct >= critAt) return 'red';
        if (pct >= warnAt) return 'yellow';
        return 'green';
    }

    private _pctBarClass(pct: number, warnAt = 60, critAt = 85): string {
        const c = this._pctColor(pct, warnAt, critAt);
        if (c === 'red') return 'bg-red-500';
        if (c === 'yellow') return 'bg-yellow-500';
        return 'bg-green-500';
    }

    private _pctTextClass(pct: number, warnAt = 60, critAt = 85): string {
        const c = this._pctColor(pct, warnAt, critAt);
        if (c === 'red') return 'text-red-500';
        if (c === 'yellow') return 'text-yellow-500';
        return 'text-green-500';
    }

    private _formatSeconds(s: number | null | undefined): string {
        if (s == null) return '--';
        if (s < 60) return `${Math.floor(s)}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
        return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
    }

    private _timeAgo(seconds: number | null | undefined): string {
        if (seconds == null) return '--';
        if (seconds < 60) return `${Math.floor(seconds)}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ago`;
    }

    private _companyLabel(code: string): string {
        if (code === 'T') return 'Tokyu';
        if (code === 'Y') return 'Yokohama';
        return code;
    }

    private _formatIsoShort(iso: string | null | undefined): string {
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

    private _channelHeartbeatColor(ch: LaserChannelStatus): string {
        if (!ch.connected) return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 30) return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 10) return 'bg-yellow-500';
        return 'bg-green-500';
    }
}
