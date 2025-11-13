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
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoPlayerDialogComponent } from './video-player-dialog/video-player-dialog.component';

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
    imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
    templateUrl: './video-grid.component.html',
})
export class VideoGridComponent implements AfterViewInit, OnChanges {
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

    safeUrlToVideoMetaMap: Map<SafeResourceUrl, VideoItem> = new Map();

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

    private setupPage() {
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
        } else {
            this.autoplayBlocked = false;
        }
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
            width: '90vw',
			maxHeight: '90vh',
            data: {
                url: url,
                filename: this.safeUrlToVideoMetaMap.get(url)?.filename.split('.')?.[0] ?? '',
                frameRate: 30,
            },
        });
    }
}
