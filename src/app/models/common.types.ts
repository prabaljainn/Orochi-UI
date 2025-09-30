export interface SnackbarType {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description: string;
    timeoutId?: number;
}

export type Dropdown = {
    key: Array<any> | number | string | object | boolean;
    displayValue: string;
    disabled?: boolean;
};

export const VerdictMap: Map<string, string> = new Map<string, string>([
    ['AC', 'Accepted'],
    ['RJ', 'Rejected'],
    ['NA', 'Not Annotated'],
]);

export interface TaskElement {
    projectId: string;
    taskId: string;
    trainId: string;
    timeAndDate: string;
    status: string;
    verdict: string;
    annotation: string;
    assignee: string;
    action?: string;
}

export enum CommentType {
	GEN = 'GEN',
	ISS = 'ISS',
	Q = 'Q',
	FB = 'FB',
	REV = 'REV',
	Note = 'Note',
}

export const CommentTypeMap: Map<string, string> = new Map<string, string>([
    ['GEN', 'General'],
    ['ISS', 'Issue'],
    ['Q', 'Question'],
    ['FB', 'Feedback'],
    ['REV', 'Review'],
    ['Note', 'Note'],
]);

// export type CommentType = 'GEN' | 'ISS' | 'Q' | 'FB' | 'REV' | 'Note';

export interface TaskCommentPayload {
    task: string;
    message: string;
    comment_type: CommentType;
    parent_comment?: string;
}

export interface TaskComment {
    id: number;
    author: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
    };
    message: string;
    comment_type: CommentType;
    comment_type_display: string;
    parent_comment: number | null;
    is_reply: boolean;
    reply_count: number;
    created_date: string;
    updated_date: string;
    is_edited: boolean;
    replies: Comment[];
}
