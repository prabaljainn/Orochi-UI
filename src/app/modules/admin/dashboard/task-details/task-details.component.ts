import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';

@Component({
    selector: 'app-task-details',
    imports: [],
    templateUrl: './task-details.component.html',
})
export class TaskDetailsComponent {
    projectId = signal<string>('');
    taskId = signal<string>('');

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
}
