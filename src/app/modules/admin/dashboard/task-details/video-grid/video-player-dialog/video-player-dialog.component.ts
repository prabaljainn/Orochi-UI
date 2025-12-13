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

export interface VideoDialogData {
    url: string;
    filename?: string;
    frameRate?: number; // optional, default 30
    startTime?: number; // optional start time in seconds
}

@Component({
    selector: 'app-video-player-dialog',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatTooltipModule, BouncyLoaderComponent],
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

    // seeking helpers
    seeking = false;
    private wasPlayingBeforeSeek = false;

    // listeners bound references for removal
    private onLoadedMetadataBound = this.onLoadedMetadata.bind(this);
    private onTimeUpdateBound = this.onTimeUpdate.bind(this);
    private onEndedBound = this.onEnded.bind(this);
    private onWaitingBound = () => { this.isLoading = true; this.cd.detectChanges(); };
    private onCanPlayBound = () => { this.isLoading = false; this.cd.detectChanges(); };
    private onPlayingBound = () => { this.isLoading = false; this.cd.detectChanges(); };

    private hasSetStartTime = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: VideoDialogData,
        private sanitizer: DomSanitizer,
        private dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
        private cd: ChangeDetectorRef
    ) {
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

        // attempt to play (the click that opened dialog is a user gesture)
        // Check if paused to avoid redundant calls if browser somehow started it (unlikely without autoplay)
        if (v.paused) {
            v.play()
                .then(() => {
                    this.playing = true;
                    this.playbackRate = v.playbackRate || 1;
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
        this.cd.detectChanges();
    }

    private onTimeUpdate() {
        if (!this.seeking) {
            this.currentTime = this.videoRef.nativeElement.currentTime || 0;
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
            this.cd.detectChanges();
        } else {
            v.play()
                .then(() => {
                    this.playing = true;
                    this.playbackRate = v.playbackRate || 1;
                    this.cd.detectChanges();
                })
                .catch((err) => {
                    console.warn('play failed', err);
                    this.playing = false;
                    this.cd.detectChanges();
                });
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
            }
            this.isLoading = true; // seeking usually implies loading
        } catch {}
    }

    // live UI update while dragging
    onSeekChange(value: number) {
        this.currentTime = value;
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
        // resume playing if it was playing before the seek
        if (this.wasPlayingBeforeSeek) {
            v.play()
                .then(() => {
                    this.playing = true;
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
        const current = v.currentTime || 0;
        const target = Math.max(
            0,
            Math.min(dur, current + delta * this.frameTime)
        );
        await this.waitForSeek(target, 1200);
        // tiny delay to make sure frame rendered
        await new Promise((res) => setTimeout(res, 20));
        this.currentTime = v.currentTime || target;
        this.cd.detectChanges();
    }

    // --- playback rate ---
    setPlaybackRate(rate: number) {
        this.playbackRate = rate;
        try {
            this.videoRef.nativeElement.playbackRate = rate;
        } catch (err) {
            console.warn('setPlaybackRate error', err);
        }
        this.cd.detectChanges();
    }

    // --- zoom / pan ---
    setZoom(value: number) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, value));
        if (this.zoom === 1) {
            this.translateX = 0;
            this.translateY = 0;
        }
        this.applyTransform();
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

    applyTransform() {
        const el = this.videoWrapper?.nativeElement;
        if (el)
            el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
    }

    // onPointerDown(evt: PointerEvent) {
    //     if (this.zoom <= 1) return;
    //     this.isPanning = true;
    //     this.lastPointerX = evt.clientX;
    //     this.lastPointerY = evt.clientY;
    //     try {
    //         (evt.target as HTMLElement).setPointerCapture(evt.pointerId);
    //     } catch {}
    // }
    // onPointerMove(evt: PointerEvent) {
    //     if (!this.isPanning) return;
    //     const dx = evt.clientX - this.lastPointerX;
    //     const dy = evt.clientY - this.lastPointerY;
    //     this.lastPointerX = evt.clientX;
    //     this.lastPointerY = evt.clientY;
    //     this.translateX += dx;
    //     this.translateY += dy;
    //     this.applyTransform();
    // }
    // onPointerUp(evt: PointerEvent) {
    //     if (!this.isPanning) return;
    //     this.isPanning = false;
    //     try {
    //         (evt.target as HTMLElement).releasePointerCapture(evt.pointerId);
    //     } catch {}
    // }

    close() {
        this.dialogRef.close();
    }

    // keyboard shortcuts
    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent) {
        if (event.key === ' ' || event.code === 'Space') {
            event.preventDefault();
            this.togglePlay();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.stepFrame(1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.stepFrame(-1);
        } else if (event.key === 'Escape') {
            this.close();
        }
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
}
