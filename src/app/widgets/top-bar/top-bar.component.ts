import { Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    ],
    templateUrl: './top-bar.component.html',
})
export class TopBarComponent {
	title = input<string>('');
	showDateRange = input<boolean>(false);
    filterByList = input<Array<Dropdown>>();
	selectedFilterBy = signal<string>(this.filterByList()?.[0]?.key as string);

	onDateRangeChange = output<{ start: string, end: string }>();
	onFilterByChange = output<string>();

	timeZone = input<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

    range: FormGroup = new FormGroup({
        start: new FormControl<Date | null>(null),
        end: new FormControl<Date | null>(null),
    });


	constructor() {
		effect(() => {
			if (this.filterByList()) {
				this.selectedFilterBy.set(this.filterByList()?.[0]?.key as string);
			}
		});
	}

	ngOnInit() {
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

				this.onDateRangeChange.emit({ start: formattedStart, end: formattedEnd });
            }
        });
	}


	filterByChange(value: string) {
		this.selectedFilterBy.set(value);
		if (value === 'custom') {
			return;
		}

		this.onFilterByChange.emit(value);
	}
}
