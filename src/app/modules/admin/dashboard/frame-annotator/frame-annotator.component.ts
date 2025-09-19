import { CommonModule } from '@angular/common';
import {
    Component,
    input,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FrameData, ScaledShape, ShapeType } from 'app/models/annotation.types';
import { FrameApiService } from 'app/services/frame-api.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-frame-annotator',
    imports: [CommonModule],
    templateUrl: './frame-annotator.component.html',
    styleUrl: './frame-annotator.component.scss',
})
export class FrameAnnotatorComponent implements OnInit {
	jobId = input<number>();
    frameNumber = input<number>();
    displayWidth: number = 800;
    displayHeight: number = 600;

    frameData: FrameData | null = null;
    frameImageUrl: SafeUrl;
    scaledShapes: ScaledShape[] = [];
    scaledTracks: ScaledShape[] = [];
    loading = false;
    error: string | null = null;

    // Shape type groups for template
    rectangles: ScaledShape[] = [];
    polygons: ScaledShape[] = [];
    polylines: ScaledShape[] = [];
    points: ScaledShape[] = [];
    ellipses: ScaledShape[] = [];
    cuboids: ScaledShape[] = [];

    constructor(
        private _frameApiService: FrameApiService,
        private _sanitizer: DomSanitizer
    ) {}

    ngOnInit() {
        this.loadFrameData();
    }

    async loadFrameData() {
        if (!this.jobId() || this.frameNumber() === undefined) return;

        this.loading = true;
        this.error = null;

        forkJoin({
            meta: this._frameApiService.getMeta(this.jobId(), this.frameNumber()),
            imageBlob: this._frameApiService.getFrameImageUrl(
                this.jobId(),
                this.frameNumber()
            ),
        }).subscribe({
            next: ({ meta, imageBlob }) => {
                // Meta assignment
                this.frameData = meta;
				this.displayWidth = meta.frame_meta.width;
				this.displayHeight = meta.frame_meta.height;

                // Image processing
                const fileType = imageBlob.type;
                const extension = fileType.split('/')[1];
                const file = new File(
                    [imageBlob],
                    `${this.frameNumber()}.${extension}`,
                    {
                        type: fileType,
                    }
                );

                this.frameImageUrl = this._sanitizer.bypassSecurityTrustUrl(
                    window.URL.createObjectURL(file)
                );

                // Process annotations only after both are ready
                this.processAnnotations();
            },
            error: (err) => {
                console.error('Failed to load frame data:', err);
                this.error = `Failed to load frame data: ${err}`;
            },
            complete: () => {
                this.loading = false;
            },
        });
    }

    processAnnotations() {
        if (!this.frameData) return;

        // Process shapes
        this.scaledShapes = this.frameData.annotations.shapes.map((shape) =>
            this.createScaledShape(shape)
        );

        // Process tracks (treat track shapes as regular shapes)
        this.scaledTracks = this.frameData.annotations.tracks.map((track) =>
            this.createScaledShape(track.shape, track.track_id)
        );

        // Group by shape type for template
        this.groupShapesByType([...this.scaledShapes, ...this.scaledTracks]);
    }

    private createScaledShape(shape: any, trackId?: number): ScaledShape {
        const scaledPoints = this.scaleCoordinates(shape.points);
        const color = this.getLabelColor(shape.label);

        return {
            ...shape,
            scaledPoints,
            color,
            svgPath: this.createSvgPath(shape.type, scaledPoints),
            trackId,
        };
    }

    private scaleCoordinates(points: number[]): number[] {
        if (!this.frameData || points.length === 0) return points;

        const scaleX = this.displayWidth / this.frameData.frame_meta.width;
        const scaleY = this.displayHeight / this.frameData.frame_meta.height;

        return points.map((point, index) =>
            index % 2 === 0 ? point * scaleX : point * scaleY
        );
    }

    private createSvgPath(type: ShapeType, points: number[]): string {
        switch (type) {
            case 'polygon':
                return this.createPolygonPath(points);
            case 'polyline':
                return this.createPolylinePath(points);
            case 'cuboid':
                return this.createCuboidPath(points);
            default:
                return '';
        }
    }

    private createPolygonPath(points: number[]): string {
        if (points.length < 6) return '';

        let path = `M ${points[0]} ${points[1]}`;
        for (let i = 2; i < points.length; i += 2) {
            path += ` L ${points[i]} ${points[i + 1]}`;
        }
        path += ' Z'; // Close path
        return path;
    }

    private createPolylinePath(points: number[]): string {
        if (points.length < 4) return '';

        let path = `M ${points[0]} ${points[1]}`;
        for (let i = 2; i < points.length; i += 2) {
            path += ` L ${points[i]} ${points[i + 1]}`;
        }
        return path; // Don't close path for polyline
    }

    private createCuboidPath(points: number[]): string {
        if (points.length !== 16) return '';

        // Cuboid is 8 points (16 coordinates) representing 8 corners of 3D box
        // Connect them to form visible edges
        const connections = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0], // Front face
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4], // Back face
            [0, 4],
            [1, 5],
            [2, 6],
            [3, 7], // Connecting edges
        ];

        let path = '';
        connections.forEach(([start, end]) => {
            const x1 = points[start * 2];
            const y1 = points[start * 2 + 1];
            const x2 = points[end * 2];
            const y2 = points[end * 2 + 1];
            path += `M ${x1} ${y1} L ${x2} ${y2} `;
        });

        return path;
    }

    private groupShapesByType(shapes: ScaledShape[]) {
        this.rectangles = shapes.filter((s) => s.type === 'rectangle');
        this.polygons = shapes.filter((s) => s.type === 'polygon');
        this.polylines = shapes.filter((s) => s.type === 'polyline');
        this.points = shapes.filter((s) => s.type === 'points');
        this.ellipses = shapes.filter((s) => s.type === 'ellipse');
        this.cuboids = shapes.filter((s) => s.type === 'cuboid');
    }

    private getLabelColor(label: string): string {
        // Generate consistent colors for labels
        const colors = [
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#96CEB4',
            '#FFEAA7',
            '#DDA0DD',
            '#98D8C8',
            '#F7DC6F',
            '#BB8FCE',
            '#85C1E9',
        ];

        let hash = 0;
        for (let i = 0; i < label.length; i++) {
            hash = label.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    }

    // Template helper methods
    getRectangleProps(shape: ScaledShape) {
        const [x1, y1, x2, y2] = shape.scaledPoints;
        return {
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
        };
    }

    getEllipseProps(shape: ScaledShape) {
        const [cx, cy, rx, ry] = shape.scaledPoints;
        return { cx, cy, rx, ry };
    }

    getPointPairs(points: number[]): Array<{ x: number; y: number }> {
        const pairs = [];
        for (let i = 0; i < points.length; i += 2) {
            pairs.push({ x: points[i], y: points[i + 1] });
        }
        return pairs;
    }
}
