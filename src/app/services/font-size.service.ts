import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FontSizeService {
    private _fontSize = new BehaviorSubject<'normal' | 'large' | 'xl'>(
        'normal'
    );

    /**
     * Getter for font size
     */
    get fontSize$(): Observable<'normal' | 'large' | 'xl'> {
        return this._fontSize.asObservable();
    }

    setFontSize(size: 'normal' | 'large' | 'xl') {
        document.documentElement.classList.remove(
            'body-normal',
            'body-large',
            'body-xl'
        );
        document.documentElement.classList.add(`body-${size}`);
        localStorage.setItem('fontSize', size);
        this._fontSize.next(size);
    }

    loadSavedPreference() {
        const size = localStorage.getItem('fontSize') as any;
        if (size) {
            this.setFontSize(size);
        }
    }
}
