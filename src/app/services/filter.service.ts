import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GenericFilters {
    [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class FilterService {
    // Maintain a separate BehaviorSubject for each key
    private _filtersMap = new Map<string, BehaviorSubject<GenericFilters>>();

    constructor() {}

    /**
     * Returns observable for a specific storage key.
     */
    filters$(key: string): Observable<GenericFilters> {
        if (!this._filtersMap.has(key)) {
            this._filtersMap.set(
                key,
                new BehaviorSubject<GenericFilters>(
                    this.loadFromStorage(key) || {}
                )
            );
        }
        return this._filtersMap.get(key)!.asObservable();
    }

    /**
     * Returns the current snapshot of filters for a given key.
     */
    snapshot(key: string): GenericFilters {
        if (!this._filtersMap.has(key)) {
            this._filtersMap.set(
                key,
                new BehaviorSubject<GenericFilters>(
                    this.loadFromStorage(key) || {}
                )
            );
        }
        return this._filtersMap.get(key)!.value;
    }

    /**
     * Sets and persists filters for a given key.
     */
    setFilters(key: string, filters: GenericFilters) {
        if (!this._filtersMap.has(key)) {
            this._filtersMap.set(key, new BehaviorSubject<GenericFilters>({}));
        }
        this._filtersMap.get(key)!.next(filters);
        this.saveToStorage(key, filters);
    }

    /**
     * Clears filters for a specific key.
     */
    clear(key: string) {
        if (this._filtersMap.has(key)) {
            this._filtersMap.get(key)!.next({});
        }
        sessionStorage.removeItem(key);
    }

    /**
     * Persists filters to sessionStorage.
     */
    private saveToStorage(key: string, filters: GenericFilters) {
        try {
            sessionStorage.setItem(key, JSON.stringify(filters));
        } catch (e) {
            console.warn(`Failed to save filters for key: ${key}`, e);
        }
    }

    /**
     * Loads filters from sessionStorage.
     */
    private loadFromStorage(key: string): GenericFilters | null {
        try {
            const saved = sessionStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.warn(`Failed to load filters for key: ${key}`, e);
            return null;
        }
    }
}
