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
