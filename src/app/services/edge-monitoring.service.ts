import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { SystemStatus } from 'app/models/monitoring.types';

// TODO: Switch to real API calls when edge server communication is ready
// const EDGE_BASE = 'http://100.65.222.10:8000';

const MOCK_DATA: SystemStatus = {
    timestamp: '2026-03-17T08:05:16.269070+00:00',
    edge_server: {
        hostname: 'tkr-edge',
        uptime_seconds: 828635,
        uptime_human: '9d 14h 10m',
        cpu_pct: 4.0,
        cpu_count: 16,
        memory_total_gb: 31.0,
        memory_used_gb: 4.0,
        memory_available_gb: 27.0,
        memory_pct: 13.0,
        disk_root_pct: 4,
        disk_data_pct: 2,
        disk_root: {
            mount: '/',
            total_gb: 878.6,
            used_gb: 27.5,
            available_gb: 806.4,
            use_pct: 4,
        },
        disk_data: {
            mount: '/app/recordings',
            total_gb: 3519.2,
            used_gb: 65.0,
            available_gb: 3275.4,
            use_pct: 2,
        },
    },
    rfid: {
        reader_ip: '192.168.109.102',
        reader_port: 4001,
        service_alive: true,
        connected: true,
        last_tag: {
            train_id: '04108',
            company: 'T',
            decoded_data: 'T041083',
            valid: true,
            timestamp: '2026-03-17T16:51:41.897148+09:00',
            cycle: 205566,
        },
        seconds_since_last_tag: 813.8,
        heartbeat: {
            connected: true,
            reader_ip: '192.168.109.102',
            reader_port: 4001,
            is_running: true,
            timestamp: '2026-03-17T17:04:58.614870+09:00',
            uptime_s: 300,
        },
    },
    laser_sensors: {
        reachable: true,
        channels: {
            DI0: {
                port: 9020,
                connected: true,
                peer_ip: '192.168.109.101',
                last_heartbeat: '2026-03-17T17:05:10.123',
                last_heartbeat_age_s: 2.0,
                last_event: 'OFF',
                last_event_time: '2026-03-17T17:00:33.099',
            },
            DI2: {
                port: 9022,
                connected: true,
                peer_ip: '192.168.109.101',
                last_heartbeat: '2026-03-17T17:05:11.456',
                last_heartbeat_age_s: 0.5,
                last_event: 'OFF',
                last_event_time: '2026-03-17T17:00:33.139',
            },
        },
        channel_states: { DI0: 'OFF', DI2: 'OFF' },
        last_session: {
            start_time: '2026-03-17T14:00:14.720',
            end_time: '2026-03-17T14:01:27.887',
            duration_seconds: 73.17,
            trigger_events: 'DI0/DI2',
        },
        session_active: false,
        error: null,
    },
    cameras: [
        { id: 'cam1', status: 'online', last_check: '2026-03-17T08:04:09.724266', error_message: null, recording: false },
        { id: 'cam2', status: 'online', last_check: '2026-03-17T08:04:10.727444', error_message: null, recording: false },
        { id: 'cam3', status: 'online', last_check: '2026-03-17T08:04:11.737155', error_message: null, recording: false },
        { id: 'cam4', status: 'online', last_check: '2026-03-17T08:04:12.789350', error_message: null, recording: false },
        { id: 'cam5', status: 'offline', last_check: '2026-03-17T08:04:13.793681', error_message: 'ffmpeg: connection refused', recording: false },
        { id: 'cam6', status: 'online', last_check: '2026-03-17T08:04:14.780379', error_message: null, recording: true },
    ],
    services: [
        { name: 'recording-service', healthy: true, details: { version: '2.0.0', active_recordings: 0, total_cameras: 6 } },
        { name: 'redis-service', healthy: true, details: { url: 'http://redis-service:8002' } },
    ],
    external_services: [
        {
            name: 'cvat',
            healthy: true,
            reachable: true,
            url: 'https://okkunsys.tokyu.co.jp',
            response_time_ms: 52.72,
            error: null,
            details: {
                status: 'ok',
            },
        },
        {
            name: 'aws_s3',
            healthy: true,
            reachable: true,
            url: 's3://tokyu-corp-videos-dir-007d275e',
            response_time_ms: 130.78,
            error: null,
            details: {
                bucket: 'tokyu-corp-videos-dir-007d275e',
                region: 'ap-northeast-1',
            },
        },
    ],
    containers: [],
};

@Injectable({
    providedIn: 'root',
})
export class EdgeMonitoringService {
    getStatus(): Observable<SystemStatus> {
        // Simulate ~500ms network latency
        return of(structuredClone(MOCK_DATA)).pipe(delay(500));
    }

    recheck(): Observable<SystemStatus> {
        return of(structuredClone(MOCK_DATA)).pipe(delay(800));
    }
}
