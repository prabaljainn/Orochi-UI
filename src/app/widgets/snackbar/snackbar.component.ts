import { NgClass } from '@angular/common';
import { Component, inject, input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarType } from 'app/models/common.types';
import { DataService, MessageIds } from 'app/services/data.service';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-snackbar',
    imports: [NgClass, MatIconModule],
    templateUrl: './snackbar.component.html',
})
export class SnackbarComponent implements OnInit {
    alerts: Array<SnackbarType> = [];

    private _dataService = inject(DataService);

    ngOnInit(): void {
        this._dataService.currentMessage$.subscribe((res: any) => {
            // Add null check
            if (!res) {
                return;
            }

            if (res.id === MessageIds.SNACKBAR_TRIGGERED) {
                const alert: SnackbarType = {
                    type: res.data?.type || 'info',
                    title: res.data?.title || '',
                    description: res.data?.description || '',
                };

                this.alerts.push(alert);

                alert.timeoutId = window.setTimeout(() => {
                    this.close(alert);
                }, 10 * 1000);
            }
        });
    }

    icon(type: 'success' | 'error' | 'warning' | 'info') {
        return type === 'success'
            ? 'heroicons_outline:check-circle'
            : type === 'error'
            ? 'heroicons_outline:x-circle'
            : type === 'warning'
            ? 'heroicons_outline:exclamation-triangle'
            : 'heroicons_outline:information-circle';
    }

    close(alert: SnackbarType): void {
        if (alert.timeoutId) {
            clearTimeout(alert.timeoutId);
        }

        this.alerts = this.alerts.filter(
            (res: SnackbarType) => res.timeoutId !== alert.timeoutId
        );
    }
}
