import {
    ChangeDetectionStrategy,
    Component,
    effect,
    input,
    OnDestroy,
    signal,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import {
    FrameData,
    Label,
    ScaledShape,
    ShapeType,
} from 'app/models/annotation.types';
import { FrameApiService } from 'app/services/frame-api.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-frame-annotator',
    standalone: true,
    imports: [],
    templateUrl: './frame-annotator.component.html',
    styleUrl: './frame-annotator.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameAnnotatorComponent implements OnDestroy {
    jobId = input<number>();
    frameNumber = input<number>();
    labelNameToLabelMap = input<Map<string, Label>>();
    maxDisplayWidth = input<number>();
    maxDisplayHeight = input<number>();

    displayWidth = signal<number>(800);
    displayHeight = signal<number>(600);
    scaleFactor = signal<number>(1);

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

    // Track the current ObjectURL for cleanup
    private _currentObjectUrl: string | null = null;

    constructor(
        private _frameApiService: FrameApiService,
        private _sanitizer: DomSanitizer
    ) {
        effect(() => {
            // Access signals to track them
            this.labelNameToLabelMap();
            this.loadFrameData();
        });
    }

    ngOnDestroy(): void {
        // Revoke any outstanding ObjectURL to prevent memory leak
        this._revokeObjectUrl();
    }

    async loadFrameData() {
        if (!this.jobId() || this.frameNumber() === undefined) return;

        this.loading = true;
        this.error = null;

        forkJoin({
            meta: this._frameApiService.getMeta(
                this.jobId(),
                this.frameNumber()
            ),
            imageBlob: this._frameApiService.getFrameImageUrl(
                this.jobId(),
                this.frameNumber()
            ),
        }).subscribe({
            next: ({ meta, imageBlob }) => {
                // Meta assignment
                this.frameData = meta;

                // Calculate display dimensions to fit within maxDisplayWidth/maxDisplayHeight
                this.calculateDisplayDimensions(
                    meta.frame_meta.width,
                    meta.frame_meta.height
                );

                // Image processing — revoke previous ObjectURL first
                this._revokeObjectUrl();

                const fileType = imageBlob.type;
                const extension = fileType.split('/')[1];
                const file = new File(
                    [imageBlob],
                    `${this.frameNumber()}.${extension}`,
                    {
                        type: fileType,
                    }
                );

                this._currentObjectUrl = window.URL.createObjectURL(file);
                this.frameImageUrl = this._sanitizer.bypassSecurityTrustUrl(
                    this._currentObjectUrl
                );

                // Process annotations only after both are ready
                this.processAnnotations();
            },
            error: (err) => {
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
        const color = this.labelNameToLabelMap()?.get(shape.label)?.label_color;

        const scaled: ScaledShape = {
            ...shape,
            scaledPoints,
            color,
            svgPath: this.createSvgPath(shape.type, scaledPoints),
            trackId,
        };

        // Pre-compute shape-specific props for template performance
        if (shape.type === 'rectangle') {
            const [x1, y1, x2, y2] = scaledPoints;
            scaled.rectProps = {
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1),
                height: Math.abs(y2 - y1),
            };
        } else if (shape.type === 'ellipse') {
            const [cx, cy, rx, ry] = scaledPoints;
            scaled.ellipseProps = { cx, cy, rx, ry };
        } else if (shape.type === 'points') {
            const pairs = [];
            for (let i = 0; i < scaledPoints.length; i += 2) {
                pairs.push({ x: scaledPoints[i], y: scaledPoints[i + 1] });
            }
            scaled.pointPairs = pairs;
        }

        return scaled;
    }

    private calculateDisplayDimensions(
        originalWidth: number,
        originalHeight: number
    ) {
        if (!this.maxDisplayWidth() || !this.maxDisplayHeight()) {
            this.displayWidth.set(originalWidth);
            this.displayHeight.set(originalHeight);
            this.scaleFactor.set(1);
            return;
        }

        const maxWidth = this.maxDisplayWidth();
        const maxHeight = this.maxDisplayHeight();

        const scaleX = maxWidth / originalWidth;
        const scaleY = maxHeight / originalHeight;
        const scale = Math.min(scaleX, scaleY);

        const displayWidth = Math.round(originalWidth * scale);
        const displayHeight = Math.round(originalHeight * scale);

        this.displayWidth.set(displayWidth);
        this.displayHeight.set(displayHeight);
        this.scaleFactor.set(scale);
    }

    private scaleCoordinates(points: number[]): number[] {
        if (!this.frameData || points.length === 0) return points;
        const scale = this.scaleFactor();
        return points.map((point) => point * scale);
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
        path += ' Z';
        return path;
    }

    private createPolylinePath(points: number[]): string {
        if (points.length < 4) return '';

        let path = `M ${points[0]} ${points[1]}`;
        for (let i = 2; i < points.length; i += 2) {
            path += ` L ${points[i]} ${points[i + 1]}`;
        }
        return path;
    }

    private createCuboidPath(points: number[]): string {
        if (points.length !== 16) return '';

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
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

    getLabelColor(labelName: string): string {
        const label = this.labelNameToLabelMap()?.get(labelName);
        return label?.label_color || '#000000';
    }

    private _revokeObjectUrl(): void {
        if (this._currentObjectUrl) {
            window.URL.revokeObjectURL(this._currentObjectUrl);
            this._currentObjectUrl = null;
        }
    }
}
