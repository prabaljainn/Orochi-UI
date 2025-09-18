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
