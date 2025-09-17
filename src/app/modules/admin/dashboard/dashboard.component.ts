import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    OnInit,
    signal,
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
import { Dropdown, VerdictMap } from 'app/models/common.types';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { TrainAnalyticsService } from 'app/services/train-analytics.service';
import { DateTime } from 'luxon';
import { debounceTime } from 'rxjs';
import { KeyValuePipe, NgClass } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PolarAreaChartComponent } from 'app/widgets/polar-area-chart/polar-area-chart.component';

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
        KeyValuePipe,
        NgClass,
        MatDatepickerModule,
		PolarAreaChartComponent,
    ],
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements AfterViewInit, OnInit {
    displayedColumns: string[] = [
        'trainId',
        'timeAndDate',
        'status',
        'verdict',
        'annotation',
        'assignee',
        'action',
    ];
    dataSource = new MatTableDataSource<any>();
    noDataMsg: string = 'No data found';
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('paginator') paginator: MatPaginator;
    pageSizeOptions: number[] = [10, 20, 50];
    pageIndex: number = 1;
    pageSize: number = this.pageSizeOptions[0];

    searchInputControl: FormControl = new FormControl('');

    filterByList: Array<Dropdown> = [
        {
            key: 'today',
            displayValue: 'Today',
        },
        {
            key: 'last3days',
            displayValue: 'Last 3 days',
        },
        {
            key: 'last7days',
            displayValue: 'Last 7 days',
        },
        {
            key: 'custom',
            displayValue: 'Custom Date Range',
        },
    ];
    selectedFilterBy = signal<string>(this.filterByList[0].key as string);

    verdictFilterList: Array<Dropdown> = [
        {
            key: '',
            displayValue: 'All',
        },
        {
            key: 'AC',
            displayValue: 'Accepted',
        },
        {
            key: 'RJ',
            displayValue: 'Rejected',
        },
        {
            key: 'NA',
            displayValue: 'Not Annotated',
        },
    ];
    verdictFilterControl: FormControl = new FormControl(
        this.verdictFilterList[0].key
    );
    VerdictMap = VerdictMap;

	verdictInfo = {
		total : 0,
		accepted : 0,
		rejected : 0,
		notAnnotated : 0,
	}

	verdictChartData = {
		series: [],
		labels: ['Total', 'Accepted', 'Rejected', 'Not Annotated'],
		colors: ['#4D96FF', '#6BCB77', '#EB5353', '#FF9D23'],
	}

    cardList: any = {
        totoal: {
            title: 'Total',
            value: 'N/A',
            id: 'total',
            icon: 'sudocode:total',
        },
        accepted: {
            title: 'Accepted',
            id: 'accepted',
            value: 100,
            icon: 'sudocode:accepted',
        },
        rejected: {
            title: 'Rejected',
            id: 'rejected',
            value: 100,
            icon: 'sudocode:rejected',
        },
        notAnnotated: {
            title: 'Not Annotated',
            id: 'not-annotated',
            value: 100,
            icon: 'sudocode:not-verified',
        },
    };

    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fromTime = DateTime.now().startOf('day').setZone(this.timeZone).toISO();
    toTime = DateTime.now().endOf('day').setZone(this.timeZone).toISO();

    range: FormGroup = new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
    });

    /**
     * Constructor
     */
    constructor(
        private _trainAnalyticsService: TrainAnalyticsService,
        private _cdr: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    ngOnInit(): void {
        this._setupFormControls();
        this.getTasks(
            this.pageIndex,
            this.pageSize,
            this.fromTime,
            this.toTime,
            this.verdictFilterControl.value,
            this.searchInputControl.value
        );
    }

    private _setupFormControls() {
        this.searchInputControl.valueChanges
            .pipe(debounceTime(500))
            .subscribe((value) => {
                this.getTasks(
                    this.pageIndex,
                    this.pageSize,
                    this.fromTime,
                    this.toTime,
                    this.verdictFilterControl.value,
                    value
                );
            });

        this.verdictFilterControl.valueChanges.subscribe((value) => {
            this.getTasks(
                this.pageIndex,
                this.pageSize,
                this.fromTime,
                this.toTime,
                value,
                this.searchInputControl.value
            );
        });

        this.range.valueChanges.subscribe((value) => {
            if (value.start && value.end) {
                const formattedStart = DateTime.fromJSDate(value.start)
					.startOf('day')
                    .setZone(this.timeZone)
                    .toISO();

                const formattedEnd = DateTime.fromJSDate(value.end)
					.endOf('day')
                    .setZone(this.timeZone)
                    .toISO();

                this.getTasks(
                    this.pageIndex,
                    this.pageSize,
                    formattedStart,
                    formattedEnd,
                    this.verdictFilterControl.value,
                    this.searchInputControl.value
                );
            }
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
                    let summary = res?.analytics?.summary;
                    this.cardList.totoal.value = summary?.total_tasks;
                    this.cardList.accepted.value = summary?.ac_tasks;
                    this.cardList.rejected.value = summary?.rj_tasks;
                    this.cardList.notAnnotated.value = summary?.na_tasks;

					this.verdictInfo.total = summary?.total_tasks;
					this.verdictInfo.accepted = summary?.ac_tasks;
					this.verdictInfo.rejected = summary?.rj_tasks;
					this.verdictInfo.notAnnotated = summary?.na_tasks;

					this.verdictChartData.series = [summary?.total_tasks, summary?.ac_tasks, summary?.rj_tasks, summary?.na_tasks];

                    let data = [];
                    res?.results?.forEach((result: any) => {
                        data.push({
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
                        this.paginator.length = summary?.total_tasks || 0;
                        this._cdr.detectChanges();
                    }, 100);
                },
            });
    }

    onDateChange(value: any) {
        this.selectedFilterBy.set(value);
        if (value === 'custom') {
            return;
        }

        // default is today
        this.fromTime = DateTime.now()
            .startOf('day')
            .setZone(this.timeZone)
            .toISO();
        this.toTime = DateTime.now()
            .endOf('day')
            .setZone(this.timeZone)
            .toISO();

        if (value === 'last3days') {
            this.fromTime = DateTime.now()
                .minus({ days: 3 })
                .startOf('day')
                .setZone(this.timeZone)
                .toISO();
            this.toTime = DateTime.now()
                .endOf('day')
                .setZone(this.timeZone)
                .toISO();
        } else if (value === 'last7days') {
            this.fromTime = DateTime.now()
                .minus({ days: 7 })
                .startOf('day')
                .setZone(this.timeZone)
                .toISO();
            this.toTime = DateTime.now()
                .endOf('day')
                .setZone(this.timeZone)
                .toISO();
        }

        this.getTasks(
            this.pageIndex,
            this.pageSize,
            this.fromTime,
            this.toTime,
            this.verdictFilterControl.value,
            this.searchInputControl.value
        );
    }

    onPageChange(event: any) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
    }
}
