export interface SnackbarType {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description: string;
    timeoutId?: number;
}