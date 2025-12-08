import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
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
import { Dropdown, TaskElement, VerdictMap } from 'app/models/common.types';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';
import { DateTime } from 'luxon';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PolarAreaChartComponent } from 'app/widgets/polar-area-chart/polar-area-chart.component';
import { ActivatedRoute, Router } from '@angular/router';
import { TopBarComponent } from 'app/widgets/top-bar/top-bar.component';
import { FilterService } from 'app/services/filter.service';

const DASHBOARD_KEY = 'dashboard_filters';

@Component({
    selector: 'dashboard',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        NgClass,
        MatDatepickerModule,
        PolarAreaChartComponent,
        TopBarComponent,
    ],
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements AfterViewInit, OnInit {
    title: string = $localize`Dashboard`;
    displayedColumns: string[] = [
        'trainId',
        'timeAndDate',
        'status',
        'verdict',
        'annotation',
        'assignee',
    ];
    dataSource = new MatTableDataSource<TaskElement>();
    noDataMsg: string = $localize`No data found`;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('paginator') paginator: MatPaginator;
    pageSizeOptions: number[] = [10, 20, 50];
    pageIndex: number = 1;
    pageSize: number = this.pageSizeOptions[0];

    searchInputControl: FormControl = new FormControl('');

    filterByList: Array<Dropdown> = [
        {
            key: 'today',
            displayValue: $localize`Today`,
        },
        {
            key: 'last3days',
            displayValue: $localize`Last 3 days`,
        },
        {
            key: 'last7days',
            displayValue: $localize`Last 7 days`,
        },
        {
            key: 'last30days',
            displayValue: $localize`Last 30 days`,
        },
        {
            key: 'custom',
            displayValue: $localize`Custom Date Range`,
        },
    ];

    verdictFilterList: Array<Dropdown> = [
        {
            key: '',
            displayValue: $localize`All`,
        },
        {
            key: 'AC',
            displayValue: $localize`Accepted`,
        },
        {
            key: 'RJ',
            displayValue: $localize`Rejected`,
        },
        {
            key: 'NA',
            displayValue: $localize`Not Annotated`,
        },
    ];
    verdictFilterControl: FormControl = new FormControl(
        this.verdictFilterList[0].key
    );
    VerdictMap = VerdictMap;

    verdictInfo = {
        total: 0,
        accepted: 0,
        rejected: 0,
        notAnnotated: 0,
    };

    verdictChartData = {
        series: [],
        labels: [
            $localize`Total`,
            $localize`Accepted`,
            $localize`Rejected`,
            $localize`Not Annotated`,
        ],
        colors: ['#4D96FF', '#6BCB77', '#EB5353', '#FF9D23'],
    };

    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fromTime = DateTime.now().startOf('day').setZone(this.timeZone).toISO();
    toTime = DateTime.now().endOf('day').setZone(this.timeZone).toISO();

    private destroy$ = new Subject<void>();

    filtersForm: FormGroup = new FormGroup({
        verdict: new FormControl(''),
        search: new FormControl(''),
        dateType: new FormControl(''),
        from: new FormControl(''),
        to: new FormControl(''),
    });

    /**
     * Constructor
     */
    constructor(
        private _trainAnalyticsService: TrainAnalyticsService,
        private _cdr: ChangeDetectorRef,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _filterService: FilterService
    ) {}

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
        this._setupFormControls();

        this._activatedRoute.queryParamMap
            .pipe(takeUntil(this.destroy$))
            .subscribe((params) => {
                const hasQueryParams = params.keys.length > 0;
                if (hasQueryParams) {
                    const qp: any = {
                        verdict: params.get('verdict') || '',
                        q: params.get('q') || '',
                        from: params.get('from') || '',
                        to: params.get('to') || '',
                        dateType: params.get('dateType') || '',
                    };
                    this.restoreState(qp);
                    this._filterService.setFilters(DASHBOARD_KEY, qp);
                    this.fetchResults();
                } else {
                    // fallback if no query params
                    const saved = this._filterService.snapshot(DASHBOARD_KEY);
                    if (saved && Object.keys(saved).length > 0) {
                        this.restoreState(saved);
                        // sync to URL for consistency
                        this.updateQueryParams(saved, true);
                        // fetchResults will be triggered by URL update if we navigate,
                        // but since we are replacing URL without navigation event if already on same route?
                        // Actually router.navigate will trigger queryParams subscription again if they change.
                        // But if they are same, it might not.
                        // Let's just fetch here if we are not navigating.
                        this.fetchResults();
                    } else {
                        // Default case: 'today'
                        this.applyDateTypeLogic('today');
                        const defaultFilters = {
                            dateType: 'today',
                            from: this.fromTime,
                            to: this.toTime,
                            verdict: '',
                            q: '',
                        };
                        this.filtersForm.patchValue(defaultFilters, {
                            emitEvent: false,
                        });
                        this._filterService.setFilters(
                            DASHBOARD_KEY,
                            defaultFilters
                        );
                        // We do NOT update URL here to keep it clean (optional preference),
                        // OR we force it so sharing works immediately.
                        // User said "if i share url... same filters".
                        // It implies explicit filters should be in URL.
                        // But "default as today" implies implicit.
                        // Let's keep URL clean for default, but state consistent.
                        this.fetchResults();
                    }
                }
            });

        // STEP 2: Watch Form Changes → update Query Params + FilterService
        this.filtersForm.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(
                    (a, b) => JSON.stringify(a) === JSON.stringify(b)
                ),
                takeUntil(this.destroy$)
            )
            .subscribe((val) => {
                const cleaned = this.clean(val);
                if (cleaned.search !== undefined) {
                    cleaned.q = cleaned.search;
                    delete cleaned.search;
                }

                // If dateType is custom but no specific dates, we might face issues.
                // But logic handles it.

                this.updateQueryParams(cleaned);
                this._filterService.setFilters(DASHBOARD_KEY, cleaned);
                // this.fetchResults(); // API call triggered by URL change via updateQueryParams -> queryParamMap
            });
    }

    private restoreState(filters: any) {
        const unified = {
            verdict: filters.verdict || '',
            search: filters.q || filters.search || '',
            from: filters.from || '',
            to: filters.to || '',
            dateType: filters.dateType || 'today', // Default to today if missing in deep restore
        };

        // If dateType is custom, we MUST have from/to. If not, fallback to today.
        // if (unified.dateType === 'custom' && (!unified.from || !unified.to)) {
        //     unified.dateType = 'today';
        // }

        // Apply logic to set fromTime/toTime strings component-wide
        if (unified.dateType !== 'custom') {
            this.applyDateTypeLogic(unified.dateType);
            unified.from = this.fromTime;
            unified.to = this.toTime;
        } else {
            this.fromTime = unified.from;
            this.toTime = unified.to;
        }

        this.filtersForm.patchValue(unified, { emitEvent: false });

        if (unified.verdict !== undefined) {
            this.verdictFilterControl.setValue(unified.verdict, {
                emitEvent: false,
            });
        }

        if (unified.search !== undefined) {
            this.searchInputControl.setValue(unified.search, {
                emitEvent: false,
            });
        }
    }

    private applyDateTypeLogic(value: string) {
        if (value === 'custom') return;

        // Reset to Today first as base calculation
        let start = DateTime.now().startOf('day').setZone(this.timeZone);
        let end = DateTime.now().endOf('day').setZone(this.timeZone);

        if (value === 'last3days') {
            start = start.minus({ days: 3 });
        } else if (value === 'last7days') {
            start = start.minus({ days: 7 });
        } else if (value === 'last30days') {
            start = start.minus({ days: 30 });
        }

        this.fromTime = start.toISO();
        this.toTime = end.toISO();
    }

    private updateQueryParams(params: any, replace = false) {
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParams: this.clean(params),
            replaceUrl: replace, // true when restoring to avoid adding to history
        });
    }

    private clean(obj: any) {
        const out: any = {};
        Object.keys(obj).forEach((k) => {
            if (
                obj[k] !== null &&
                obj[k] !== undefined &&
                String(obj[k]).trim() !== ''
            ) {
                out[k] = obj[k];
            }
        });
        return out;
    }

    clearFilters() {
        this.filtersForm.reset({ verdict: '', q: '', from: '', to: '' });
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParams: {},
            replaceUrl: true,
        });
        this._filterService.clear(DASHBOARD_KEY);
        this.fetchResults();
    }

    private fetchResults() {
        // Read values from form (or from explicit controls if you're using them)
        const v = this.filtersForm ? this.filtersForm.value : {};
        // If you use dedicated FormControls (as in your snippet), prefer their values:
        const verdict = this.verdictFilterControl?.value ?? v.verdict ?? '';
        const search = this.searchInputControl?.value ?? v.q ?? '';
        const from = v.from ?? this.fromTime ?? '';
        const to = v.to ?? this.toTime ?? '';

        // Keep component-level fromTime/toTime in sync
        this.fromTime = from;
        this.toTime = to;

        if (!this.fromTime || !this.toTime) {
            this.dataSource = new MatTableDataSource([]);
            this.paginator.length = 0;
            this.verdictInfo = {
                total: 0,
                accepted: 0,
                rejected: 0,
                notAnnotated: 0,
            };
            this.verdictChartData.series = [];
            this._cdr.detectChanges();
            return;
        }

        // Call the summary + list APIs with the current time range and filters
        this.getTasksSummary(this.fromTime, this.toTime);

        this.getTasks(
            this.pageIndex,
            this.pageSize,
            this.fromTime,
            this.toTime,
            verdict,
            search
        );
    }

    private _setupFormControls() {
        this.searchInputControl.valueChanges
            .pipe(debounceTime(500))
            .subscribe((value) => {
                this.filtersForm.patchValue({ search: value });
                // API call triggered by filtersForm.valueChanges
            });

        this.verdictFilterControl.valueChanges.subscribe((value) => {
            this.filtersForm.patchValue({ verdict: value });
            // API call triggered by filtersForm.valueChanges
        });
    }

    getTasksSummary(fromTime: string, toTime: string) {
        this._trainAnalyticsService
            .getTasksSummary(fromTime, toTime)
            .subscribe({
                next: (res: any) => {
                    let summary = res?.summary;
                    this.verdictInfo.total = summary?.total_tasks;
                    this.verdictInfo.accepted = summary?.ac_tasks;
                    this.verdictInfo.rejected = summary?.rj_tasks;
                    this.verdictInfo.notAnnotated = summary?.na_tasks;

                    this.verdictChartData.series = [
                        summary?.total_tasks,
                        summary?.ac_tasks,
                        summary?.rj_tasks,
                        summary?.na_tasks,
                    ];
                },
            });
    }

    getTasks(
        page: number,
        pageSize: number,
        fromTime: string,
        toTime: string,
        verdict: string,
        search: string,
        include_analytics: boolean = true
    ) {
        this._trainAnalyticsService
            .getTasks(
                page,
                pageSize,
                fromTime,
                toTime,
                verdict,
                search,
                include_analytics
            )
            .subscribe({
                next: (res: any) => {
                    let data: TaskElement[] = [];
                    res?.results?.forEach((result: any) => {
                        data.push({
                            projectId: result?.project_id ?? '- -',
                            taskId: result?.task_id ?? '- -',
                            trainId: result?.train_metadata?.train_id ?? '- -',
                            timeAndDate:
                                DateTime?.fromISO(
                                    result?.time_data?.task_created,
                                    {
                                        zone: this.timeZone,
                                    }
                                )?.toFormat('hh:mm a dd/MM/yyyy') ?? '- -',
                            status: result?.status?.toUpperCase() ?? '- -',
                            verdict:
                                result?.train_metadata?.verdict?.toUpperCase() ??
                                '- -',
                            annotation: `${result?.annotation_stats?.annotated_frames}/${result?.annotation_stats?.total_frames} FRAMES`,
                            assignee: result?.assignee ?? '- -',
                        });
                    });
                    this.dataSource = new MatTableDataSource(data);
                    setTimeout(() => {
                        let totalTasks =
                            res?.analytics?.summary?.total_tasks || 0;
                        this.paginator.length = totalTasks;
                        this._cdr.detectChanges();
                    }, 100);
                },
            });
    }

    onFilterByChange(value: any) {
        this.filtersForm.patchValue({ dateType: value });

        this.applyDateTypeLogic(value);

        if (value === 'custom') {
            this.fromTime = '';
            this.toTime = '';
        }

        // Update form with calculated dates
        this.filtersForm.patchValue({ from: this.fromTime, to: this.toTime });

        // Logic below refactored into applyDateTypeLogic for reuse
    }

    onDateRangeChange(value: any) {
        const currentFrom = this.filtersForm.get('from')?.value;
        const currentTo = this.filtersForm.get('to')?.value;

        if (currentFrom === value.start && currentTo === value.end) {
            return;
        }

        this.fromTime = value.start;
        this.toTime = value.end;

        this.filtersForm.patchValue({ from: this.fromTime, to: this.toTime });
    }

    onPageChange(event: any) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
    }

    gotoTaskDetails(task: TaskElement) {
        this._router.navigate([
            'dashboard/task-details',
            task.projectId,
            task.taskId,
        ]);
    }
}
