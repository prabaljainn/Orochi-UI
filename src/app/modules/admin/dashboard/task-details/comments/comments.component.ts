import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, input, signal } from '@angular/core';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
    CommentType,
    CommentTypeMap,
    Dropdown,
    TaskComment,
    TaskCommentPayload,
} from 'app/models/common.types';
import { DataService, MessageIds } from 'app/services/data.service';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';

@Component({
    selector: 'app-comments',
    imports: [
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        NgTemplateOutlet,
    ],
    templateUrl: './comments.component.html',
    styleUrl: './comments.component.scss',
})
export class CommentsComponent {
    taskId = input<string>();
    comments = signal<TaskComment[]>([]);

    commentTypeList: Dropdown[] = [
        {
            key: CommentType.GEN,
            displayValue: CommentTypeMap.get(CommentType.GEN),
        },
        {
            key: CommentType.ISS,
            displayValue: CommentTypeMap.get(CommentType.ISS),
        },
        {
            key: CommentType.Q,
            displayValue: CommentTypeMap.get(CommentType.Q),
        },
        {
            key: CommentType.FB,
            displayValue: CommentTypeMap.get(CommentType.FB),
        },
    ];

    commentForm: FormGroup = new FormGroup({
        comment_type: new FormControl(CommentType.GEN),
        message: new FormControl(''),
    });

    parentCommentId = signal<number | null>(null);

    constructor(
        private _trainAnalyticsService: TrainAnalyticsService,
        private _dataService: DataService
    ) {
        effect(() => {
            if (this.taskId()) {
                this.getComments();
            }
        });
    }

    getComments() {
        this._trainAnalyticsService
            .getTaskComments(this.taskId())
            .subscribe((res: any) => {
                this.comments.set(this.buildCommentsTree(res.results));
                console.log(this.comments());
            });
    }

    buildCommentsTree(results: TaskComment[]) {
        const map = new Map();
        const roots = [];

        // First pass: add all comments to a map with replies initialized
        results.forEach((c: TaskComment) => {
            map.set(c.id, { ...c, replies: [] });
        });

        // Second pass: connect replies to their parents
        results.forEach((c: TaskComment) => {
            if (c.parent_comment) {
                const parent = map.get(c.parent_comment);
                if (parent) {
                    parent.replies.push(map.get(c.id));
                }
            } else {
                roots.push(map.get(c.id));
            }
        });

        return roots;
    }

    createComment() {
        if (!this.commentForm.value.message?.trim()) {
            return;
        }

        let payload: TaskCommentPayload = {
            task: Number(this.taskId()),
            message: this.commentForm.value.message,
            comment_type: this.commentForm.value.comment_type,
        };

        if (this.parentCommentId()) {
            payload['parent_comment'] = this.parentCommentId();
        }

        this._trainAnalyticsService.createTaskComment(payload).subscribe({
            next: () => {
                this.commentForm.patchValue({ message: '' });
                this.parentCommentId.set(null);
                this.getComments();
            },
            error: (err) => {
                this._dataService.changeMessage({
                    id: MessageIds.SNACKBAR_TRIGGERED,
                    data: {
                        type: 'error',
                        title: $localize`Error`,
                        description: $localize`Something went wrong. Please try again.`,
                    },
                });
            },
        });
    }

    deleteComment(comment: TaskComment) {
        this._trainAnalyticsService
            .deleteTaskComment(comment.id.toString())
            .subscribe({
				next: () => {
					this.getComments();
				},
				error: (err) => {
					this._dataService.changeMessage({
						id: MessageIds.SNACKBAR_TRIGGERED,
						data: {
							type: 'error',
							title: $localize`Error`,
							description: $localize`Something went wrong while deleting the comment. Please try again.`,
						},
					});
				}
			});
    }

    formatTimeAgo(dateString: string): string {
        const now = new Date();
        const commentDate = new Date(dateString);
        const diffInSeconds = Math.floor(
            (now.getTime() - commentDate.getTime()) / 1000
        );

        if (diffInSeconds < 60) {
            return 'now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }
}
