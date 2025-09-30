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

    constructor(private _trainAnalyticsService: TrainAnalyticsService) {
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
        let payload: TaskCommentPayload = {
            task: this.taskId(),
            message: this.commentForm.value.message,
            comment_type: this.commentForm.value.comment_type,
        };
        this._trainAnalyticsService.createTaskComment(payload).subscribe(() => {
            this.getComments();
        });
    }

    deleteComment(comment: TaskComment) {
        this._trainAnalyticsService
            .deleteTaskComment(comment.id.toString())
            .subscribe(() => {
                this.getComments();
            });
    }
}
