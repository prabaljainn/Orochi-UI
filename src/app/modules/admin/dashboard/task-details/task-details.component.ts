import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';
import { TopBarComponent } from 'app/widgets/top-bar/top-bar.component';
import { FrameAnnotatorComponent } from '../frame-annotator/frame-annotator.component';
import { FormsModule, NgModel } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
    selector: 'app-task-details',
    imports: [TopBarComponent, FrameAnnotatorComponent, FormsModule],
    templateUrl: './task-details.component.html',
})
export class TaskDetailsComponent {
    projectId = signal<string>('');
    taskId = signal<string>('');

    jobId = 6;
    currentFrame = 3;

    constructor(
        private _trainAnalyticsService: TrainAnalyticsService,
        private _activatedRoute: ActivatedRoute
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
                console.log(res);
            });
    }

    onFrameChange(frameNumber: number) {
        this.currentFrame = frameNumber;
    }
}
