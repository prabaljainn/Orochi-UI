import { Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Dropdown } from 'app/models/common.types';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-top-bar',
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatIconModule,
        MatButtonModule,
    ],
    templateUrl: './top-bar.component.html',
})
export class TopBarComponent {
    title = input<string>('');
    showDateRange = input<boolean>(false);
    filterByList = input<Array<Dropdown>>();
    selectedFilter = input<string | null>(null);
    selectedFilterBy = signal<string>('');
    showBackButton = input<boolean>(false);
    onDateRangeChange = output<{ start: string; end: string }>();
    onFilterByChange = output<string>();
    onBackButtonClick = output<void>();

    startDate = input<string | null>(null);
    endDate = input<string | null>(null);

    timeZone = input<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

    range: FormGroup = new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
    });

    constructor() {
        effect(() => {
            const initial = this.selectedFilter();
            const list = this.filterByList();

            if (initial) {
                this.selectedFilterBy.set(initial);
            } else if (list && list.length > 0) {
                this.selectedFilterBy.set(list[0].key as string);
            }
        });

        effect(() => {
            const start = this.startDate();
            const end = this.endDate();

            const current = this.range.value;
            const currentStart = current.start
                ? DateTime.fromJSDate(current.start).toISODate()
                : null;
            const currentEnd = current.end
                ? DateTime.fromJSDate(current.end).toISODate()
                : null;

            const newStart = start ? DateTime.fromISO(start).toISODate() : null;
            const newEnd = end ? DateTime.fromISO(end).toISODate() : null;

            if (start && end) {
                if (currentStart !== newStart || currentEnd !== newEnd) {
                    this.range.patchValue(
                        {
                            start: DateTime.fromISO(start).toJSDate(),
                            end: DateTime.fromISO(end).toJSDate(),
                        },
                        { emitEvent: false }
                    );
                }
            } else {
                if (current.start || current.end) {
                    this.range.reset({}, { emitEvent: false });
                }
            }
        });
    }

    ngOnInit() {
        this.range.controls['start'].valueChanges.subscribe(() => {
            if (this.range.controls['end'].value) {
                this.range.controls['end'].reset(null);
            }
        });

        this.range.valueChanges.subscribe((value) => {
            if (value.start && value.end) {
                const formattedStart = DateTime.fromJSDate(value.start)
                    .startOf('day')
                    .setZone(this.timeZone())
                    .toISO();

                const formattedEnd = DateTime.fromJSDate(value.end)
                    .endOf('day')
                    .setZone(this.timeZone())
                    .toISO();

                this.onDateRangeChange.emit({
                    start: formattedStart,
                    end: formattedEnd,
                });
            }
        });
    }

    filterByChange(value: string) {
        this.selectedFilterBy.set(value);
        this.onFilterByChange.emit(value);
    }
}
