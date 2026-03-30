// ── System Status (GET /api/v1/system/status) ──────────────────

export interface SystemStatus {
    timestamp: string;
    edge_server: EdgeServerInfo;
    rfid: RfidStatus;
    laser_sensors: LaserStatus;
    cameras: CameraStatusSummary[];
    services: ServiceHealth[];
    external_services?: ExternalServiceHealth[];
    infrastructure: InfrastructureDevice[];
    idrac: IdracStatus | null;
    containers: ContainerStatus[];
}

// ── Edge Server ─────────────────────────────────────────────────

export interface EdgeServerInfo {
    hostname: string;
    uptime_seconds: number;
    uptime_human: string;
    cpu_pct: number;
    cpu_count: number;
    memory_total_gb: number;
    memory_used_gb: number;
    memory_available_gb: number;
    memory_pct: number;
    disk_root_pct: number;
    disk_data_pct: number;
    disk_root: DiskInfo;
    disk_data: DiskInfo;
}

export interface DiskInfo {
    mount: string;
    total_gb: number;
    used_gb: number;
    available_gb: number;
    use_pct: number;
}

// ── RFID ────────────────────────────────────────────────────────

export interface RfidStatus {
    reader_ip: string;
    reader_port: number;
    service_alive: boolean;
    connected: boolean;
    last_tag: RfidTag | null;
    seconds_since_last_tag: number | null;
    heartbeat: RfidHeartbeat | null;
}

export interface RfidTag {
    train_id: string;
    company: string;
    decoded_data: string;
    valid: boolean;
    timestamp: string;
    cycle: number;
}

export interface RfidHeartbeat {
    connected: boolean;
    reader_ip: string;
    reader_port: number;
    is_running: boolean;
    timestamp: string;
    uptime_s: number;
}

// ── Laser Sensors ───────────────────────────────────────────────

export interface LaserChannelStatus {
    port: number;
    connected: boolean;
    peer_ip: string | null;
    last_heartbeat: string | null;
    last_heartbeat_age_s: number | null;
    last_event: string | null;
    last_event_time: string | null;
}

export interface LaserStatus {
    reachable: boolean;
    channels: {
        DI0: LaserChannelStatus;
        DI2: LaserChannelStatus;
    };
    channel_states: {
        DI0: string;
        DI2: string;
    };
    last_session: LaserSession | null;
    session_active: boolean;
    error: string | null;
}

export interface LaserSession {
    start_time: string;
    end_time: string;
    duration_seconds: number;
    trigger_events: string;
}

// ── Cameras ─────────────────────────────────────────────────────

export interface CameraStatusSummary {
    id: string;
    status: string;
    last_check: string | null;
    error_message: string | null;
    recording: boolean;
}

// ── Services ────────────────────────────────────────────────────

export interface ServiceHealth {
    name: string;
    healthy: boolean;
    details: Record<string, any>;
}

export interface ExternalServiceHealth {
    name: string;
    healthy: boolean;
    reachable: boolean;
    url: string;
    response_time_ms: number;
    error: string | null;
    details: Record<string, any>;
}

// ── Infrastructure ──────────────────────────────────────────────

export type InfrastructureType =
    | 'switch'
    | 'router'
    | 'io_module'
    | 'serial_bridge'
    | 'server_mgmt';

export interface InfrastructureDevice {
    id: string;
    name: string;
    type: InfrastructureType;
    ip: string;
    reachable: boolean;
    check_method: string;
    response_time_ms: number;
    error: string | null;
    details: Record<string, any>;
}

// ── iDRAC ───────────────────────────────────────────────────────

export interface IdracStatus {
    system_health: string;
    cpu_temp_celsius: number | null;
    inlet_temp_celsius: number | null;
    power_state: string;
    fan_status: string;
    psu_status: string;
    disk_status: string;
    model: string;
    bios_version: string;
    service_tag: string;
    error: string | null;
}

// ── Containers ──────────────────────────────────────────────────

export interface ContainerStatus {
    name: string;
    status: string;
    health: string | null;
}

// ── Health Check (GET /api/v1/health) ───────────────────────────

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    active_recordings: number;
    total_cameras: number;
}
