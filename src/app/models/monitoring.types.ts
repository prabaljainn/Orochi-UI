export interface SystemStatus {
    timestamp: string;
    edge_server: EdgeServerInfo;
    rfid: RfidStatus;
    laser_sensors: LaserStatus;
    cameras: CameraStatusSummary[];
    services: ServiceHealth[];
    external_services?: ExternalServiceHealth[];
    containers: ContainerStatus[];
}

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

export interface RfidStatus {
    reader_ip: string;
    reader_port: number;
    service_alive: boolean;
    connected: boolean;
    last_tag: {
        train_id: string;
        company: string;
        decoded_data: string;
        valid: boolean;
        timestamp: string;
        cycle: number;
    } | null;
    seconds_since_last_tag: number | null;
    heartbeat: {
        connected: boolean;
        reader_ip: string;
        reader_port: number;
        is_running: boolean;
        timestamp: string;
        uptime_s: number;
    } | null;
}

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
    last_session: {
        start_time: string;
        end_time: string;
        duration_seconds: number;
        trigger_events: string;
    } | null;
    session_active: boolean;
    error: string | null;
}

export interface CameraStatusSummary {
    id: string;
    status: string;
    last_check: string | null;
    error_message: string | null;
    recording: boolean;
}

export interface ServiceHealth {
    name: string;
    healthy: boolean;
    details: Record<string, any>;
}

export interface ContainerStatus {
    name: string;
    status: string;
    health: string | null;
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
