import { CommonModule } from '@angular/common';
import {
    Component,
    Input,
    ViewChildren,
    QueryList,
    ElementRef,
    AfterViewInit,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
    OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerDialogComponent } from './video-player-dialog/video-player-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface VideoItem {
    key: string;
    filename: string;
    size: number;
    last_modified: string;
    presigned_url: string;
    expiration_seconds?: number;
}

@Component({
    selector: 'app-video-grid',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './video-grid.component.html',
})
export class VideoGridComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() videos: VideoItem[] = [];
    @Input() pageSize = 6;
    @ViewChildren('videoPlayer') videoElems!: QueryList<
        ElementRef<HTMLVideoElement>
    >;

    currentPage = 0;
    safeUrlsOnPage: SafeResourceUrl[] = [];
    autoplayBlocked = false;
    loading = false;
    mutedByDefault = true;
    totalPages = 0;

    playing = false; // Track global playing state
    safeUrlToVideoMetaMap: Map<SafeResourceUrl, VideoItem> = new Map();
    
    maxDuration = 0;
    currentProgress = 0;
    isDragging = false;
    private animationFrameId: number | null = null;
    private wasPlayingBeforeDrag = false;

    constructor(
        private sanitizer: DomSanitizer,
        private cd: ChangeDetectorRef,
        private dialog: MatDialog
    ) {}

    ngAfterViewInit() {
        this.setupPage();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['videos']) {
            this.currentPage = 0;
            this.setupPage();
        }
    }

    ngOnDestroy() {
        this.stopProgressLoop();
    }

    private setupPage() {
        this.maxDuration = 0;
        this.currentProgress = 0;
        this.stopProgressLoop();
        this.totalPages = Math.max(
            1,
            Math.ceil((this.videos?.length || 0) / this.pageSize)
        );
        this.updateSafeUrlsForPage();
        // small timeout so ViewChildren is available
        setTimeout(() => {
            this.tryPlayAll();
            this.cd.detectChanges();
        }, 120);
    }

    private updateSafeUrlsForPage() {
        const start = this.currentPage * this.pageSize;
        const pageItems = (this.videos || []).slice(
            start,
            start + this.pageSize
        );
        this.safeUrlsOnPage = pageItems.map((v) => {
            let safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                v.presigned_url
            );
            this.safeUrlToVideoMetaMap.set(safeUrl, v);
            return safeUrl;
        });
    }

    private async tryPlayAll() {
        this.autoplayBlocked = false;
        this.loading = true;

        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];

        elems.forEach((v) => {
            v.muted = this.mutedByDefault;
            v.playsInline = true;
            v.preload = 'metadata';
        });

        const playPromises = elems.map((v) => {
            try {
                return v.play();
            } catch (err) {
                return Promise.reject(err);
            }
        });

        const results = await Promise.allSettled(playPromises);
        this.loading = false;

        const anyRejected = results.some((r) => r.status === 'rejected');
        if (anyRejected) {
            elems.forEach((e) => {
                try {
                    e.pause();
                } catch {}
            });
            this.autoplayBlocked = true;
            this.playing = false;
            this.stopProgressLoop();
        } else {
            this.autoplayBlocked = false;
            this.playing = true;
            this.startProgressLoop();
        }
    }

    togglePlay() {
        this.playing = !this.playing;
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];

        if (this.playing) {
            this.startProgressLoop();
        } else {
            this.stopProgressLoop();
        }

        elems.forEach((v) => {
            try {
                if (this.playing) {
                    v.play();
                } else {
                    v.pause();
                }
            } catch (error) {
                console.error('Error toggling play state:', error);
            }
        });
    }

    stepFrame(direction: number) {
        // Pause first if playing
        if (this.playing) {
            this.playing = false;
            this.togglePlay(); // This will pause because we set playing to false above, but wait..
            // actually togglePlay uses the current this.playing state.
            // If I set this.playing = false, then call togglePlay(), it sees false and pauses. Correct.
            // BUT, togglePlay flips the boolean first thing.
            // So better to just manually pause and set logic.
        }

        // Ensure we are paused and state reflects it
        this.playing = false;
        this.stopProgressLoop();
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];

        elems.forEach((v) => {
            try {
                v.pause();
                // 1/30 seems to be the assumed frame rate from the dialog component
                v.currentTime += direction * (1 / 30);
            } catch (error) {
                console.error('Error stepping frame', error);
            }
        });
        
        // Sync progress bar
        if (elems.length > 0) {
            // Recalculate max time to ensure progress bar reflects the new state
            const times = elems.map(v => v.currentTime);
            this.currentProgress = Math.max(...times);
            this.cd.detectChanges();
        }
    }

    resetVideo() {
        this.playing = false;
        this.stopProgressLoop();
        this.currentProgress = 0;
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
        
        elems.forEach((v) => {
            try {
                v.currentTime = 0;
 				v.pause();
            } catch (error) {
                console.error('Error resetting video:', error);
            }
        });
    }

    async playAllUserInitiated(unmuteAfter = false) {
        this.autoplayBlocked = false;
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];

        elems.forEach((v) => {
            try {
                v.currentTime = 0;
            } catch {}
            v.muted = !unmuteAfter ? true : false;
            v.playsInline = true;
        });

        const promises = elems.map((v) =>
            v.play().catch((err) => console.warn('play error', err))
        );
        await Promise.all(promises);
        this.playing = true;
        this.startProgressLoop();
    }

    async syncStart(unmuteAfter = false) {
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
        elems.forEach((v) => {
            try {
                v.pause();
                v.currentTime = 0;
            } catch {}
            v.muted = !unmuteAfter ? true : false;
        });
        await new Promise((res) => setTimeout(res, 60));
        await this.playAllUserInitiated(unmuteAfter);
    }

    toggleMuteAll() {
        const elems =
            this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
        const anyMuted = elems.some((v) => v.muted);
        elems.forEach((v) => (v.muted = !anyMuted));
    }

    nextPage() {
        if (this.currentPage + 1 >= this.totalPages) return;
        this.currentPage++;
        this.updateSafeUrlsForPage();
        setTimeout(() => this.tryPlayAll(), 120);
    }

    prevPage() {
        if (this.currentPage === 0) return;
        this.currentPage--;
        this.updateSafeUrlsForPage();
        setTimeout(() => this.tryPlayAll(), 120);
    }

    gotoPage(page: number) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.updateSafeUrlsForPage();
        setTimeout(() => this.tryPlayAll(), 120);
    }

    updateVideos(newVideos: VideoItem[]) {
        this.videos = newVideos;
        this.totalPages = Math.max(
            1,
            Math.ceil((this.videos?.length || 0) / this.pageSize)
        );
        if (this.currentPage >= this.totalPages)
            this.currentPage = this.totalPages - 1;
        this.updateSafeUrlsForPage();
        setTimeout(() => this.tryPlayAll(), 120);
    }

    trackByIndex(i: number) {
        return i;
    }

    get showingRange(): string {
        const start = this.currentPage * this.pageSize + 1;
        const end = Math.min(
            (this.currentPage + 1) * this.pageSize,
            this.videos.length
        );
        return `${start} – ${end}`;
    }

    openVideoDialog(url: SafeResourceUrl) {
        this.dialog.open(VideoPlayerDialogComponent, {
            width: '95%',
            data: {
                url: url,
                filename:
                    this.safeUrlToVideoMetaMap
                        .get(url)
                        ?.filename.split('.')?.[0] ?? '',
                frameRate: 30,
            },
        });
    }

    onMetadataLoaded(event: Event) {
        const video = event.target as HTMLVideoElement;
        if (isFinite(video.duration) && video.duration > this.maxDuration) {
            this.maxDuration = video.duration;
            this.cd.detectChanges();
        }
    }

    private startProgressLoop() {
        this.stopProgressLoop();
        const loop = () => {
            if (this.playing && !this.isDragging) {
                const elems = this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
                if (elems.length > 0) {
                    const times = elems.map(v => v.currentTime);
                    const maxTime = Math.max(...times);
                    this.currentProgress = maxTime;

                    // Check if we reached the end of the longest video
                    // Allow a small buffer (e.g., 0.1s) to ensure we hit the end
                    if (this.maxDuration > 0 && maxTime >= this.maxDuration - 0.05) {
                        this.triggerSyncRestart(elems);
                        return; // Exit current loop frame, will restart in triggerSyncRestart
                    }
                    this.cd.detectChanges();
                }
                this.animationFrameId = requestAnimationFrame(loop);
            }
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    private async triggerSyncRestart(elems: HTMLVideoElement[]) {
        // Pause and reset all
        elems.forEach(v => {
            v.pause();
            v.currentTime = 0;
        });
        this.currentProgress = 0;
        this.cd.detectChanges(); // Update UI to show 0

        // Restart
        if (this.playing) {
             const promises = elems.map((v) =>
                v.play().catch((err) => console.warn('loop restart error', err))
            );
            await Promise.all(promises);
            // Restart loop
            this.startProgressLoop();
        }
    }

    private stopProgressLoop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    onSeek(event: Event) {
        const input = event.target as HTMLInputElement;
        const value = Number(input.value);
        this.currentProgress = value;
        const elems = this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
        elems.forEach((v) => {
            v.currentTime = value;
        });
    }

    onSeekStart() {
        this.isDragging = true;
        this.wasPlayingBeforeDrag = this.playing;
        if (this.playing) {
            // Pause all without setting global playing state to false permanently if we want to resume
            this.playing = false;
            this.stopProgressLoop();
            
            const elems = this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
            elems.forEach(v => v.pause());
        }
    }

    onSeekEnd() {
        this.isDragging = false;
        if (this.wasPlayingBeforeDrag) {
            this.playing = true;
            this.startProgressLoop();
            
            const elems = this.videoElems?.toArray().map((q) => q.nativeElement) ?? [];
            elems.forEach(v => v.play().catch(e => console.error(e)));
        }
    }
}
