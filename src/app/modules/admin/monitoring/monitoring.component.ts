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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EdgeMonitoringService } from 'app/services/edge-monitoring.service';
import {
    SystemStatus,
    LaserChannelStatus,
    InfrastructureDevice,
} from 'app/models/monitoring.types';
import { Subject, interval, takeUntil, catchError, of } from 'rxjs';

/** Poll interval in milliseconds (60 s). */
const POLL_INTERVAL = 60_000;

@Component({
    selector: 'monitoring',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './monitoring.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringComponent implements OnInit, OnDestroy {
    title = 'Monitoring';

    data: SystemStatus | null = null;
    edgeOffline = false;
    loading = false;
    lastSyncedAgo = 0;
    lastSyncTimestamp: Date | null = null;

    // ── Pre-computed: cameras ───────────────────────────────────
    onlineCameraCount = 0;
    offlineCameraCount = 0;
    cameraSummaryDotClass = 'bg-emerald-500';

    // ── Pre-computed: services ──────────────────────────────────
    servicesHealthy = false;
    externalServicesHealthy = false;

    // ── Pre-computed: resource gauge classes ────────────────────
    cpuTextClass = 'text-green-500';
    cpuBarClass = 'bg-green-500';
    memoryTextClass = 'text-green-500';
    memoryBarClass = 'bg-green-500';
    diskRootTextClass = 'text-green-500';
    diskRootBarClass = 'bg-green-500';
    diskDataTextClass = 'text-green-500';
    diskDataBarClass = 'bg-green-500';

    // ── Pre-computed: RFID ──────────────────────────────────────
    rfidCompanyLabel = '';
    rfidTimeAgo = '';
    rfidUptimeFormatted = '';

    // ── Pre-computed: laser sensors ─────────────────────────────
    channelDI0Color = 'bg-red-500';
    channelDI2Color = 'bg-red-500';
    lastSessionStart = '--';
    lastSessionEnd = '--';

    // ── Pre-computed: infrastructure ────────────────────────────
    infraReachableCount = 0;
    infraTotalCount = 0;

    // ── Pre-computed: iDRAC ─────────────────────────────────────
    idracHealthClass = 'text-green-500';

    private _destroy$ = new Subject<void>();
    private _tickerInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        private _edgeService: EdgeMonitoringService,
        private _cdr: ChangeDetectorRef,
        private _ngZone: NgZone,
    ) {}

    // ── Lifecycle ───────────────────────────────────────────────

    ngOnInit(): void {
        this.fetchStatus();

        interval(POLL_INTERVAL)
            .pipe(takeUntil(this._destroy$))
            .subscribe(() => this.fetchStatus());

        // 1-second ticker runs outside Angular zone
        this._ngZone.runOutsideAngular(() => {
            this._tickerInterval = setInterval(() => {
                if (this.lastSyncTimestamp) {
                    this.lastSyncedAgo = Math.floor(
                        (Date.now() - this.lastSyncTimestamp.getTime()) / 1000,
                    );
                    this._cdr.detectChanges();
                }
            }, 1000);
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        if (this._tickerInterval) {
            clearInterval(this._tickerInterval);
        }
    }

    // ── Data fetching ───────────────────────────────────────────

    fetchStatus(): void {
        this.loading = true;
        this._cdr.markForCheck();

        this._edgeService
            .getStatus()
            .pipe(
                catchError(() => {
                    this.edgeOffline = true;
                    this.loading = false;
                    this._cdr.markForCheck();
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                    this._computeDerived();
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
                catchError(() => {
                    this.edgeOffline = true;
                    this.loading = false;
                    this._cdr.markForCheck();
                    return of(null);
                }),
            )
            .subscribe((res) => {
                if (res) {
                    this.data = res;
                    this.edgeOffline = false;
                    this._computeDerived();
                }
                this.loading = false;
                this.lastSyncTimestamp = new Date();
                this.lastSyncedAgo = 0;
                this._cdr.markForCheck();
            });
    }

    // ── Template helpers (pure, no side effects) ────────────────

    dotClass(online: boolean): string {
        return online ? 'bg-green-500' : 'bg-red-500';
    }

    infraTypeLabel(type: string): string {
        const map: Record<string, string> = {
            switch: 'Switch',
            router: 'Router',
            io_module: 'I/O Module',
            serial_bridge: 'Serial Bridge',
            server_mgmt: 'Server Mgmt',
        };
        return map[type] ?? type;
    }

    infraIcon(type: string): string {
        const map: Record<string, string> = {
            switch: 'heroicons_solid:server-stack',
            router: 'heroicons_solid:globe-alt',
            io_module: 'heroicons_solid:cpu-chip',
            serial_bridge: 'heroicons_solid:link',
            server_mgmt: 'heroicons_solid:wrench-screwdriver',
        };
        return map[type] ?? 'heroicons_solid:server';
    }

    idracStatusLabel(status: string): string {
        const map: Record<string, string> = {
            OK: 'Healthy',
            Warning: 'Warning',
            Critical: 'Critical',
            Degraded: 'Degraded',
        };
        return map[status] ?? status;
    }

    // ── Derivation (runs once per data update) ──────────────────

    private _computeDerived(): void {
        if (!this.data) return;

        // Cameras
        this.onlineCameraCount =
            this.data.cameras?.filter((c) => c.status === 'online').length ?? 0;
        this.offlineCameraCount =
            this.data.cameras?.filter((c) => c.status === 'offline').length ?? 0;

        if (this.offlineCameraCount === 0) {
            this.cameraSummaryDotClass = 'bg-emerald-500';
        } else if (this.onlineCameraCount === 0) {
            this.cameraSummaryDotClass = 'bg-red-500';
        } else {
            this.cameraSummaryDotClass = 'bg-amber-500';
        }

        // Services
        this.servicesHealthy =
            this.data.services?.every((s) => s.healthy) ?? false;
        this.externalServicesHealthy =
            this.data.external_services?.every((s) => s.healthy) ?? false;

        // Resource gauges
        this.cpuTextClass = this._pctTextClass(this.data.edge_server.cpu_pct);
        this.cpuBarClass = this._pctBarClass(this.data.edge_server.cpu_pct);
        this.memoryTextClass = this._pctTextClass(
            this.data.edge_server.memory_pct,
            70,
            85,
        );
        this.memoryBarClass = this._pctBarClass(
            this.data.edge_server.memory_pct,
            70,
            85,
        );
        this.diskRootTextClass = this._pctTextClass(
            this.data.edge_server.disk_root_pct,
            70,
            85,
        );
        this.diskRootBarClass = this._pctBarClass(
            this.data.edge_server.disk_root_pct,
            70,
            85,
        );
        this.diskDataTextClass = this._pctTextClass(
            this.data.edge_server.disk_data_pct,
            70,
            85,
        );
        this.diskDataBarClass = this._pctBarClass(
            this.data.edge_server.disk_data_pct,
            70,
            85,
        );

        // RFID
        if (this.data.rfid?.last_tag) {
            this.rfidCompanyLabel = this._companyLabel(
                this.data.rfid.last_tag.company,
            );
            this.rfidTimeAgo = this._timeAgo(
                this.data.rfid.seconds_since_last_tag,
            );
        }
        this.rfidUptimeFormatted = this.data.rfid?.heartbeat
            ? this._formatSeconds(this.data.rfid.heartbeat.uptime_s)
            : '--';

        // Laser channels
        if (this.data.laser_sensors?.channels) {
            this.channelDI0Color = this._channelColor(
                this.data.laser_sensors.channels.DI0,
            );
            this.channelDI2Color = this._channelColor(
                this.data.laser_sensors.channels.DI2,
            );
        }
        if (this.data.laser_sensors?.last_session) {
            this.lastSessionStart = this._formatIsoShort(
                this.data.laser_sensors.last_session.start_time,
            );
            this.lastSessionEnd = this._formatIsoShort(
                this.data.laser_sensors.last_session.end_time,
            );
        }

        // Infrastructure
        this.infraTotalCount = this.data.infrastructure?.length ?? 0;
        this.infraReachableCount =
            this.data.infrastructure?.filter((d) => d.reachable).length ?? 0;

        // iDRAC
        if (this.data.idrac) {
            this.idracHealthClass = this._idracHealthClass(
                this.data.idrac.system_health,
            );
        }
    }

    // ── Private helpers ─────────────────────────────────────────

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
        if (s < 86400)
            return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
        return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
    }

    private _timeAgo(seconds: number | null | undefined): string {
        if (seconds == null) return '--';
        if (seconds < 60) return `${Math.floor(seconds)}s ago`;
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)} min ago`;
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

    private _channelColor(ch: LaserChannelStatus): string {
        if (!ch.connected) return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 30)
            return 'bg-red-500';
        if (ch.last_heartbeat_age_s != null && ch.last_heartbeat_age_s > 10)
            return 'bg-yellow-500';
        return 'bg-green-500';
    }

    private _idracHealthClass(health: string): string {
        if (health === 'OK') return 'text-emerald-500';
        if (health === 'Warning') return 'text-yellow-500';
        return 'text-red-500';
    }
}
