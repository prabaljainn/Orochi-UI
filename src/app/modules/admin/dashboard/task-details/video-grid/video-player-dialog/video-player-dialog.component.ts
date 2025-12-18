import { CommonModule } from '@angular/common';
import {
    Component,
    Inject,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    HostListener,
    ChangeDetectorRef,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BouncyLoaderComponent } from 'app/widgets/bouncy-loader/bouncy-loader.component';
import { VideoItem } from '../video-grid.component';

export interface VideoDialogData {
    url: string;
    filename?: string;
    frameRate?: number; // optional, default 30
    startTime?: number; // optional start time in seconds
    videos?: VideoItem[];
    currentIndex?: number;
}

@Component({
    selector: 'app-video-player-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatTooltipModule,
        BouncyLoaderComponent,
    ],
    templateUrl: './video-player-dialog.component.html',
})
export class VideoPlayerDialogComponent implements AfterViewInit, OnDestroy {
    @ViewChild('videoRef', { static: true })
    videoRef!: ElementRef<HTMLVideoElement>;
    @ViewChild('videoWrapper', { static: true })
    videoWrapper!: ElementRef<HTMLDivElement>;

    safeUrl!: SafeResourceUrl;
    filename = '';

    // playback state
    playing = false;
    isLoading = true; // start loading
    duration = 0;
    currentTime = 0;
    playbackRate = 1;

    // frame stepping
    frameRate = 30;
    frameTime = 1 / 30;

    // zoom & pan
    zoom = 1;
    minZoom = 1;
    maxZoom = 3;
    translateX = 0;
    translateY = 0;
    isPanning = false;
    lastPointerX = 0;
    lastPointerY = 0;

    // Feedback state
    feedbackIcon: string | null = null;
    feedbackTimeout: any;
    showHelp = false;

    // seeking helpers
    seeking = false;
    private wasPlayingBeforeSeek = false;

    // navigation
    videos: VideoItem[] = [];
    currentVideoIndex = -1;
    hasPrev = false;
    hasNext = false;

    // listeners bound references for removal
    private onLoadedMetadataBound = this.onLoadedMetadata.bind(this);
    private onTimeUpdateBound = this.onTimeUpdate.bind(this);
    private onEndedBound = this.onEnded.bind(this);
    private onWaitingBound = () => {
        this.isLoading = true;
        this.cd.detectChanges();
    };
    private onCanPlayBound = () => {
        this.isLoading = false;
        this.cd.detectChanges();
    };
    private onPlayingBound = () => {
        this.isLoading = false;
        this.playing = true;
        this.cd.detectChanges();
    };

    private onPauseBound = () => {
        this.playing = false;
        this.cd.detectChanges();
    };

    private hasSetStartTime = false;

    // Minimap references
    @ViewChild('minimapVideoRef')
    minimapVideoRef?: ElementRef<HTMLVideoElement>;

    // Minimap state
    viewportLeftPercent = 0;
    viewportTopPercent = 0;
    viewportWidthPercent = 100;
    viewportHeightPercent = 100;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: VideoDialogData,
        private sanitizer: DomSanitizer,
        private dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
        private cd: ChangeDetectorRef
    ) {
        if (data.videos && typeof data.currentIndex === 'number') {
            this.videos = data.videos;
            this.currentVideoIndex = data.currentIndex;
        }

        this.updateNavState();

        this.safeUrl = data.url;
        this.filename = data.filename || '';
        this.frameRate = data.frameRate || 30;
        this.frameTime = 1 / this.frameRate;
    }

    ngAfterViewInit() {
        const v = this.videoRef.nativeElement;

        // custom controls: disable native controls
        v.controls = false;
        v.playsInline = true;
        // v.autoplay = true; // intentionally removed to allow manual play() control
        v.muted = false;

        // attach events
        v.addEventListener('loadedmetadata', this.onLoadedMetadataBound);
        v.addEventListener('timeupdate', this.onTimeUpdateBound);
        v.addEventListener('ended', this.onEndedBound);
        v.addEventListener('waiting', this.onWaitingBound);
        v.addEventListener('canplay', this.onCanPlayBound);
        v.addEventListener('playing', this.onPlayingBound);
        v.addEventListener('pause', this.onPauseBound);

        // attempt to play (the click that opened dialog is a user gesture)
        // Check if paused to avoid redundant calls if browser somehow started it (unlikely without autoplay)
        if (v.paused) {
            v.play()
                .then(() => {
                    this.playing = true;
                    this.playbackRate = v.playbackRate || 1;
                    this.syncMinimapPlayback();
                    this.cd.detectChanges();
                })
                .catch((err) => {
                    // fallback: don't autoplay if browser blocks, let user click play
                    console.warn('Dialog video play failed:', err);
                    this.playing = false;
                    this.cd.detectChanges();
                });
        }
    }

    ngOnDestroy() {
        try {
            const v = this.videoRef.nativeElement;
            v.pause();
            v.removeEventListener('loadedmetadata', this.onLoadedMetadataBound);
            v.removeEventListener('timeupdate', this.onTimeUpdateBound);
            v.removeEventListener('ended', this.onEndedBound);
            v.removeEventListener('waiting', this.onWaitingBound);
            v.removeEventListener('canplay', this.onCanPlayBound);
            v.removeEventListener('playing', this.onPlayingBound);
            v.removeEventListener('pause', this.onPauseBound);
            v.src = '';
        } catch {}
    }

    // --- Event handlers ---
    private onLoadedMetadata() {
        const v = this.videoRef.nativeElement;
        this.duration = v.duration || 0;

        // If start time was provided and we haven't set it yet
        if (this.data.startTime && !this.hasSetStartTime) {
            v.currentTime = this.data.startTime;
            this.hasSetStartTime = true;
        }

        this.currentTime = v.currentTime || 0;
        this.syncMinimapTime();
        this.cd.detectChanges();
    }

    private onTimeUpdate() {
        if (!this.seeking) {
            this.currentTime = this.videoRef.nativeElement.currentTime || 0;
            this.smoothSyncMinimap();
            this.cd.detectChanges();
        }
    }

    private onEnded() {
        this.playing = false;
        this.cd.detectChanges();
    }

    // --- Play/pause ---
    togglePlay() {
        const v = this.videoRef.nativeElement;
        if (this.playing) {
            v.pause();
            this.playing = false;
            this.syncMinimapPlayback();
            this.cd.detectChanges();
        } else {
            v.play()
                .then(() => {
                    this.playing = true;
                    this.playbackRate = v.playbackRate || 1;
                    this.syncMinimapPlayback();
                    this.cd.detectChanges();
                })
                .catch((err) => {
                    console.warn('play failed', err);
                    this.playing = false;
                    this.cd.detectChanges();
                });
        }
    }

    // --- Minimap Sync ---
    syncMinimapTime() {
        if (this.minimapVideoRef) {
            this.minimapVideoRef.nativeElement.currentTime = this.currentTime;
        }
    }

    syncMinimapPlayback() {
        if (!this.minimapVideoRef) return;
        const main = this.videoRef.nativeElement;
        const mini = this.minimapVideoRef.nativeElement;

        if (!main.paused) {
            mini.play().catch(() => {});
        } else {
            mini.pause();
        }
        mini.playbackRate = main.playbackRate;
    }

    smoothSyncMinimap() {
        if (!this.minimapVideoRef || !this.playing) return;

        const main = this.videoRef.nativeElement;
        const mini = this.minimapVideoRef.nativeElement;

        const diff = main.currentTime - mini.currentTime;
        const absDiff = Math.abs(diff);
        const targetRate = this.playbackRate;

        // Thresholds
        const LARGE_DRIFT = 0.5; // 500ms -> hard seek
        const SMALL_DRIFT = 0.05; // 50ms -> nudge

        if (absDiff > LARGE_DRIFT) {
            // Hard sync for large drifts
            mini.currentTime = main.currentTime;
            mini.playbackRate = targetRate;
        } else if (absDiff > SMALL_DRIFT) {
            // Nudge playback rate to catch up or slow down
            // If main is ahead (diff > 0), increased speed
            // If main is behind (diff < 0), decrease speed
            // We nudge by 20% to correct smoothly but relatively quickly
            const nudgeFactor = diff > 0 ? 1.2 : 0.8;
            mini.playbackRate = targetRate * nudgeFactor;
        } else {
            // In sync, restore target rate
            if (mini.playbackRate !== targetRate) {
                mini.playbackRate = targetRate;
            }
        }
    }

    // --- robust seek helpers ---
    private waitForSeek(targetTime: number, timeout = 1500): Promise<void> {
        const v = this.videoRef.nativeElement;
        return new Promise((resolve) => {
            let finished = false;

            const onSeeked = () => {
                if (finished) return;
                finished = true;
                try {
                    v.removeEventListener('seeked', onSeeked);
                } catch {}
                resolve();
            };

            const t = setTimeout(() => {
                if (finished) return;
                finished = true;
                try {
                    v.removeEventListener('seeked', onSeeked);
                } catch {}
                resolve();
            }, timeout);

            v.addEventListener('seeked', onSeeked);

            try {
                // clamp and set currentTime
                const dur = this.duration || v.duration || Infinity;
                const clamped = Math.max(0, Math.min(dur, targetTime));
                v.currentTime = clamped;
            } catch (err) {
                // if it throws, resolve after removing listener
                clearTimeout(t);
                if (!finished) {
                    finished = true;
                    try {
                        v.removeEventListener('seeked', onSeeked);
                    } catch {}
                }
                resolve();
            }
        });
    }

    // called on pointerdown / drag start
    onSeekStart() {
        this.seeking = true;
        const v = this.videoRef.nativeElement;
        this.wasPlayingBeforeSeek = !v.paused;
        try {
            if (!v.paused) {
                v.pause();
                this.playing = false;
                this.syncMinimapPlayback();
            }
            this.isLoading = true; // seeking usually implies loading
        } catch {}
    }

    // live UI update while dragging
    onSeekChange(value: number) {
        this.currentTime = value;
        if (this.minimapVideoRef) {
            this.minimapVideoRef.nativeElement.currentTime = value;
        }
        this.cd.detectChanges();
    }

    // commit seek when drag ends
    async onSeekEnd(value: number) {
        this.seeking = false;
        this.isLoading = true; // ensure loader stays until seek done
        const v = this.videoRef.nativeElement;
        const dur = this.duration || v.duration || 0;
        if (!isFinite(dur) || dur === 0) {
            this.cd.detectChanges();
            return;
        }
        const target = Math.max(0, Math.min(dur, value));
        await this.waitForSeek(target);
        this.currentTime = v.currentTime || target;
        this.syncMinimapTime(); // Sync minimap exactly

        // resume playing if it was playing before the seek
        if (this.wasPlayingBeforeSeek) {
            v.play()
                .then(() => {
                    this.playing = true;
                    this.syncMinimapPlayback();
                    this.cd.detectChanges();
                })
                .catch(() => {});
        } else {
            this.playing = false;
            this.isLoading = false;
            this.cd.detectChanges();
        }
    }

    // --- frame stepping (robust) ---
    async stepFrame(delta: number) {
        const v = this.videoRef.nativeElement;
        const dur = this.duration || v.duration || 0;
        if (!isFinite(dur) || dur === 0) return;

        // pause first for consistent stepping
        try {
            v.pause();
        } catch {}
        this.playing = false;
        this.syncMinimapPlayback();

        const current = v.currentTime || 0;
        const target = Math.max(
            0,
            Math.min(dur, current + delta * this.frameTime)
        );
        await this.waitForSeek(target, 1200);
        // tiny delay to make sure frame rendered
        await new Promise((res) => setTimeout(res, 20));
        this.currentTime = v.currentTime || target;
        this.syncMinimapTime();
        this.cd.detectChanges();
    }

    // --- playback rate ---
    setPlaybackRate(rate: number) {
        this.playbackRate = rate;
        try {
            this.videoRef.nativeElement.playbackRate = rate;
            if (this.minimapVideoRef) {
                this.minimapVideoRef.nativeElement.playbackRate = rate;
            }
        } catch (err) {
            console.warn('setPlaybackRate error', err);
        }
        this.cd.detectChanges();
    }

    // --- zoom / pan logic ---
    setZoom(value: number) {
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, value));
        if (newZoom !== this.zoom) {
            this.zoom = newZoom;
            if (this.zoom === 1) {
                this.translateX = 0;
                this.translateY = 0;
            } else {
                // Re-clamp translation with new zoom
                this.clampTranslation();
            }
            this.updateViewportRect();
            this.applyTransform();
        }
    }

    zoomIn() {
        this.setZoom(Math.min(this.maxZoom, this.zoom + 0.25));
    }
    zoomOut() {
        this.setZoom(Math.max(this.minZoom, this.zoom - 0.25));
    }
    resetZoom() {
        this.setZoom(1);
    }

    clampTranslation() {
        if (this.zoom <= 1) {
            this.translateX = 0;
            this.translateY = 0;
            return;
        }

        // We assume the transform origin is 'center center' (default).
        // The visible area (viewport) is fixed (W x H).
        // The content is W*zoom x H*zoom.
        // If we translate by T, the visual center moves by T.
        // We want the edges of scale content to roughly not go beyond viewport center?
        // Let's adhere to: allowed movement range behaves like standard pan.

        // rangeX = (width * zoom - width) / 2
        // But since we can't easily get width in pixels without elementRef measurement every time,
        // let's assume we implement a "fraction" based logic or just use pixels if we have them.

        const el = this.videoWrapper?.nativeElement;
        if (!el) return;

        const w = el.offsetWidth;
        const h = el.offsetHeight;

        // Max translation from center in one direction
        const maxX = (w * this.zoom - w) / 2;
        const maxY = (h * this.zoom - h) / 2;

        this.translateX = Math.max(-maxX, Math.min(maxX, this.translateX));
        this.translateY = Math.max(-maxY, Math.min(maxY, this.translateY));
    }

    applyTransform() {
        const el = this.videoWrapper?.nativeElement;
        if (el)
            el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
    }

    // Calculate viewport rectangle percentage for the minimap
    updateViewportRect() {
        if (this.zoom <= 1) {
            this.viewportLeftPercent = 0;
            this.viewportTopPercent = 0;
            this.viewportWidthPercent = 100;
            this.viewportHeightPercent = 100;
            return;
        }

        // Viewport size inversely proportional to zoom
        this.viewportWidthPercent = 100 / this.zoom;
        this.viewportHeightPercent = 100 / this.zoom;

        // Position depends on translation.
        // Translation of X means shifting the CONTENT by X.
        // If content shifts LEFT (negative X), we are looking at the RIGHT part of the image.
        // So viewport moves RIGHT.
        // Mapping:
        // max translate (+X) -> Leftmost edge of Viewport aligns with Leftmost edge of Minimap?
        // No, +X shifts content to the right. So we see the LEFT side of image.
        // So +X implies viewport is at LEFT (0).
        // -X implies viewport is at RIGHT (100 - width).

        // range of X is [-maxX, +maxX]
        // range of viewportLeft is [100 - width%, 0]  <-- NOTE INVERSE

        const el = this.videoWrapper?.nativeElement;
        if (!el) return;

        const w = el.offsetWidth;
        const maxX = (w * this.zoom - w) / 2;
        const maxY = (el.offsetHeight * this.zoom - el.offsetHeight) / 2; // Fixed: use height

        // Normalizing translation to [-1, 1] relative to max range
        const normX = maxX > 0 ? this.translateX / maxX : 0;
        const normY = maxY > 0 ? this.translateY / maxY : 0;

        // Map normX (1 -> -1) to (0 -> 100 - viewportWidth)
        // If translateX is positive (+maxX), we are at LeftEdge (0%)
        // If translateX is negative (-maxX), we are at RightEdge (max%)

        const maxLeft = 100 - this.viewportWidthPercent;
        const maxTop = 100 - this.viewportHeightPercent;

        // Interpolate:
        // normX = 1 => 0%
        // normX = -1 => maxLeft%
        // Formula: (-normX + 1) / 2 * maxLeft

        this.viewportLeftPercent = ((-normX + 1) / 2) * maxLeft;
        this.viewportTopPercent = ((-normY + 1) / 2) * maxTop;
    }

    // --- Panning interaction (Main Video) ---
    onMainPointerDown(evt: PointerEvent) {
        if (this.zoom <= 1) return;
        this.isPanning = true;
        this.lastPointerX = evt.clientX;
        this.lastPointerY = evt.clientY;
        (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
    }

    onMainPointerMove(evt: PointerEvent) {
        if (!this.isPanning) return;
        evt.preventDefault();
        const dx = evt.clientX - this.lastPointerX;
        const dy = evt.clientY - this.lastPointerY;

        this.lastPointerX = evt.clientX;
        this.lastPointerY = evt.clientY;

        this.translateX += dx;
        this.translateY += dy;

        this.clampTranslation();
        this.applyTransform();
        this.updateViewportRect();
    }

    onMainPointerUp(evt: PointerEvent) {
        if (!this.isPanning) return;
        this.isPanning = false;
        (evt.target as HTMLElement).releasePointerCapture(evt.pointerId);
    }

    // --- Minimap Dragging ---
    isMinimapDragging = false;
    lastMinimapX = 0;
    lastMinimapY = 0;

    onMinimapPointerDown(evt: PointerEvent) {
        evt.stopPropagation(); // prevent closing or other interactions
        this.isMinimapDragging = true;
        this.lastMinimapX = evt.clientX;
        this.lastMinimapY = evt.clientY;
        (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
    }

    onMinimapPointerMove(evt: PointerEvent) {
        if (!this.isMinimapDragging) return;
        evt.preventDefault();

        // Calculate delta in pixels
        const dx = evt.clientX - this.lastMinimapX;
        const dy = evt.clientY - this.lastMinimapY;

        this.lastMinimapX = evt.clientX;
        this.lastMinimapY = evt.clientY;

        // Convert pixel delta to percentage of minimap container
        // We need the minimap container dimensions.
        // We can approximate or get parent element of target.
        const container = (evt.target as HTMLElement).parentElement;
        if (!container) return;

        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        if (cw === 0 || ch === 0) return;

        // Delta %
        const dPctX = (dx / cw) * 100;
        const dPctY = (dy / ch) * 100;

        // Move viewport
        this.viewportLeftPercent += dPctX;
        this.viewportTopPercent += dPctY;

        // Clamp Viewport Logic
        const maxLeft = 100 - this.viewportWidthPercent;
        const maxTop = 100 - this.viewportHeightPercent;

        this.viewportLeftPercent = Math.max(
            0,
            Math.min(maxLeft, this.viewportLeftPercent)
        );
        this.viewportTopPercent = Math.max(
            0,
            Math.min(maxTop, this.viewportTopPercent)
        );

        // Inverse Mapping to Translate
        // Viewport 0% => Translate +Max
        // Viewport Max% => Translate -Max

        // factor 0..1 (0=left, 1=right)
        const fx = maxLeft > 0 ? this.viewportLeftPercent / maxLeft : 0;
        const fy = maxTop > 0 ? this.viewportTopPercent / maxTop : 0;

        // normX from earlier: (-normX + 1)/2 = fx  => -normX + 1 = 2*fx => normX = 1 - 2*fx
        const normX = 1 - 2 * fx;
        const normY = 1 - 2 * fy;

        const el = this.videoWrapper?.nativeElement;
        if (el) {
            const maxX = (el.offsetWidth * this.zoom - el.offsetWidth) / 2;
            const maxY = (el.offsetHeight * this.zoom - el.offsetHeight) / 2;

            this.translateX = normX * maxX;
            this.translateY = normY * maxY;

            this.applyTransform();
        }
    }

    onMinimapPointerUp(evt: PointerEvent) {
        if (!this.isMinimapDragging) return;
        this.isMinimapDragging = false;
        (evt.target as HTMLElement).releasePointerCapture(evt.pointerId);
    }

    close() {
        this.dialogRef.close();
    }

    // keyboard shortcuts
    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent) {
        // Ignore if user is typing in an input
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

        const key = event.key.toLowerCase();
        const code = event.code;

        if (code === 'Space' || key === 'k') {
            event.preventDefault();
            this.togglePlay();
            this.showFeedback(this.playing ? 'play_circle' : 'pause_circle');
        } else if (code === 'ArrowRight' || key === 'l') {
            event.preventDefault();
            this.seekRelative(5);
            this.showFeedback('fast_forward');
        } else if (code === 'ArrowLeft' || key === 'j') {
            event.preventDefault();
            this.seekRelative(-5);
            this.showFeedback('fast_rewind');
        } else if (key === '.') {
            event.preventDefault();
            this.stepFrame(1);
            this.showFeedback('skip_next');
        } else if (key === ',') {
            event.preventDefault();
            this.stepFrame(-1);
            this.showFeedback('skip_previous');
        } else if (key === 'm') {
            event.preventDefault();
            this.toggleMute();
        } else if (key === 'f') {
            event.preventDefault();
            this.toggleFullscreen();
        } else if (key === '?') {
            event.preventDefault();
            this.showHelp = !this.showHelp;
            this.cd.detectChanges();
        } else if (key === 'escape') {
            this.close();
        }
    }

    seekRelative(seconds: number) {
        const v = this.videoRef.nativeElement;
        const target = (v.currentTime || 0) + seconds;
        this.currentTime = target; // optimistic update
        v.currentTime = target;
        this.syncMinimapTime();
        this.cd.detectChanges();
    }

    toggleMute() {
        const v = this.videoRef.nativeElement;
        v.muted = !v.muted;
        this.showFeedback(v.muted ? 'volume_off' : 'volume_up');
    }

    toggleFullscreen() {
        const elem = this.videoWrapper.nativeElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    showFeedback(icon: string) {
        this.feedbackIcon = icon;
        this.cd.detectChanges();
        
        if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
        this.feedbackTimeout = setTimeout(() => {
            this.feedbackIcon = null;
            this.cd.detectChanges();
        }, 600);
    }

    // format time mm:ss or hh:mm:ss
    formatTime(sec: number) {
        if (!isFinite(sec)) return '00:00';
        const s = Math.floor(sec);
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
        return `${pad(mins)}:${pad(secs)}`;
    }

    updateNavState() {
        if (!this.videos || this.videos.length === 0) {
            this.hasPrev = false;
            this.hasNext = false;
            return;
        }
        this.hasPrev = this.currentVideoIndex > 0;
        this.hasNext = this.currentVideoIndex < this.videos.length - 1;
    }

    prevVideo() {
        if (this.hasPrev) {
            this.loadVideo(this.currentVideoIndex - 1);
        }
    }

    nextVideo() {
        if (this.hasNext) {
            this.loadVideo(this.currentVideoIndex + 1);
        }
    }

    loadVideo(index: number) {
        if (index < 0 || index >= this.videos.length) return;

        this.currentVideoIndex = index;
        const video = this.videos[index];
        this.filename = video.filename.split('.')?.[0] ?? '';

        // Sanitize URL
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            video.presigned_url
        );

        this.updateNavState();
        this.isLoading = true;
        this.cd.detectChanges();

        const v = this.videoRef.nativeElement;

        // Reset player state
        this.playing = false;
        this.currentTime = 0;
        this.duration = 0;
        v.pause();

        // Reset zoom
        this.zoom = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateViewportRect();
        this.applyTransform();

        v.load();

        // We can add a one-time listener for 'canplay' for this specific switch if we want auto-play behavior
        const onCanPlay = () => {
            this.togglePlay(); // Try to play
            v.removeEventListener('canplay', onCanPlay);
        };
        v.addEventListener('canplay', onCanPlay);
    }
}
