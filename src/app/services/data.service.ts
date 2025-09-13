import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum MessageIds {
    SNACKBAR_TRIGGERED = 'SNACKBAR_TRIGGERED',
}

@Injectable({
    providedIn: 'root',
})
export class DataService {
    private messageSource = new BehaviorSubject<{
        id: MessageIds;
        data: any;
    }>(null);

    currentMessage$ = this.messageSource.asObservable();

    constructor() {}

    changeMessage(message: { id: MessageIds; data: any }) {
        this.messageSource.next(message);
    }
}
