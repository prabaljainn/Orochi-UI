export interface FrameData {
    job_id: number;
    frame_number: number;
    frame_meta: {
        width: number;
        height: number;
        name: string;
        related_files: number;
    };
    annotations: {
        shapes: Shape[];
        tracks: Track[];
        tags: Tag[];
    };
    has_annotations: boolean;
    annotation_count: number;
}

export interface Shape {
    id: number;
    label: string;
    label_id: number;
    type: ShapeType;
    points: number[];
    occluded: boolean;
    z_order: number;
    rotation?: number;
    attributes: any[];
}

export interface Track {
    track_id: number;
    label: string;
    label_id: number;
    attributes: any[];
    shape: Shape;
}

export interface Tag {
    id: number;
    label: string;
    label_id: number;
    attributes: any[];
}

export type ShapeType =
    | 'rectangle'
    | 'polygon'
    | 'polyline'
    | 'points'
    | 'ellipse'
    | 'cuboid'
    | 'mask'
    | 'skeleton';

export interface ScaledShape extends Shape {
    scaledPoints: number[];
    color: string;
    svgPath?: string;
}

export interface Label {
    label_id: number;
    label_name: string;
    label_color: string;
    annotated_frames: number[];
    frame_count: number;
    annotation_counts: {
        shapes: number;
        tracks: number;
        tags: number;
        total: number;
    };
}
