import { Component, signal, ChangeDetectorRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';
import { TopBarComponent } from 'app/widgets/top-bar/top-bar.component';
import { FrameAnnotatorComponent } from '../frame-annotator/frame-annotator.component';
import { FormsModule } from '@angular/forms';
import { Label, TaskDetails } from 'app/models/annotation.types';
import { KeyValuePipe, NgStyle } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DateTime } from 'luxon';
import { CommentsComponent } from './comments/comments.component';
import { MatDividerModule } from '@angular/material/divider';

@Component({
    selector: 'app-task-details',
    imports: [
        TopBarComponent,
        FrameAnnotatorComponent,
        FormsModule,
        KeyValuePipe,
        MatIconModule,
        NgStyle,
        CommentsComponent,
        MatDividerModule,
    ],
    templateUrl: './task-details.component.html',
})
export class TaskDetailsComponent implements OnInit {
    projectId = signal<string>('');
    taskId = signal<string>('');

    jobId = signal<number>(6);
    currentFrame = signal<number>(0);

    labelNameToLabelMap = signal<Map<string, Label>>(new Map<string, Label>());
    selectedLabels = signal<string[]>([]);

    allFrames = signal<number[]>([]);
    selectedFrames = signal<number[]>([]);

    taskDetails = signal<TaskDetails | null>(null);

    constructor(
        private _trainAnalyticsService: TrainAnalyticsService,
        private _activatedRoute: ActivatedRoute,
        private _router: Router
    ) {}

    ngOnInit() {
        this._activatedRoute.params.subscribe((params) => {
            this.projectId.set(params['projectId'] ?? '');
            this.taskId.set(params['taskId'] ?? '');
        });

        this.getTaskAnalysis();
    }

    getTaskAnalysis() {
        this._trainAnalyticsService
            .getTaskAnalysis(this.projectId(), this.taskId())
            .subscribe((res: any) => {
                let totalFrames = 0;
                res.jobs.forEach((job: any) => {
                    if (job?.type === 'annotation') {
                        this.jobId.set(job?.id);
                        let startFrame = job?.start_frame;
                        let endFrame = job?.stop_frame;

                        let frames = this.range(startFrame, endFrame);
                        this.allFrames.set(frames);
                        this.selectedFrames.set(this.allFrames());
                        this.currentFrame.set(this.selectedFrames()[0]);

                        totalFrames = job?.frame_count;
                    }
                });

                let labelsAnalysis = res?.annotation_analysis?.labels_analysis;
                if (labelsAnalysis instanceof Object) {
                    Object.values(labelsAnalysis)?.forEach((label: Label) => {
                        this.labelNameToLabelMap.update((currentMap) => {
                            const newMap = new Map(currentMap);
                            newMap.set(label.label_name, label);
                            return newMap;
                        });
                    });
                }

                const createDate = DateTime.fromISO(res?.created_date).toFormat(
                    'dd/MM/yyyy HH:mm:ss'
                );
                this.taskDetails.set({
                    projectName: res?.project_name ?? 'N/A',
                    owner: res?.owner?.username ?? 'N/A',
                    assignee: res?.assignee ?? 'N/A',
                    createDate: createDate ?? 'N/A',
                    status: res?.status?.toUpperCase() ?? 'N/A',
                    annotatedFrames:
                        res?.annotation_analysis?.total_annotated_frames ?? 0,
                    totalFrames: totalFrames ?? 0,
                });
            });
    }

    getNextFrame() {
        this.currentFrame.set(
            this.selectedFrames()[
                this.selectedFrames().indexOf(this.currentFrame()) + 1
            ]
        );
    }

    getPreviousFrame() {
        this.currentFrame.set(
            this.selectedFrames()[
                this.selectedFrames().indexOf(this.currentFrame()) - 1
            ]
        );
    }

    onLabelClick(label: Label) {
        if (this.selectedLabels().includes(label.label_name)) {
            this.selectedLabels.update((currentLabels) =>
                currentLabels.filter((l) => l !== label.label_name)
            );
        } else {
            this.selectedLabels.update((currentLabels) => [
                ...currentLabels,
                label.label_name,
            ]);
        }

        if (this.selectedLabels().length === 0) {
            this.selectedFrames.set(this.allFrames());
            this.currentFrame.set(this.selectedFrames()[0]);
        } else {
            let frames = [];
            this.selectedLabels().forEach((label) => {
                frames.push(
                    ...(this.labelNameToLabelMap().get(label)
                        ?.annotated_frames ?? [])
                );
            });
            frames.sort((a, b) => a - b);
            this.selectedFrames.set(frames);
            this.currentFrame.set(this.selectedFrames()[0]);
        }
    }

    range(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    onBackButtonClick() {
        this._router.navigate(['dashboard']);
    }

    getBgColor(color: string) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        return `linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(${r}, ${g}, ${b}, 0.5) 100%)`;
    }
}
