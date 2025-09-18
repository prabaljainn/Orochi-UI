import {
    ChangeDetectorRef,
    Component,
    effect,
    input,
    signal,
    ViewChild,
} from '@angular/core';
import { FuseConfigService } from '@fuse/services/config';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

import {
    ApexNonAxisChartSeries,
    ApexResponsive,
    ApexChart,
    ApexTheme,
    ApexTitleSubtitle,
    ApexFill,
    ApexStroke,
    ApexYAxis,
    ApexLegend,
    ApexPlotOptions,
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    responsive: ApexResponsive[];
    labels: any;
    colors: any;
    theme: ApexTheme;
    title: ApexTitleSubtitle;
    fill: ApexFill;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
};

@Component({
    selector: 'app-polar-area-chart',
    imports: [NgApexchartsModule],
    templateUrl: './polar-area-chart.component.html',
})
export class PolarAreaChartComponent {
    series = input<number[]>([]);
    labels = input<string[]>([]);
    colors = input<string[]>([]);
    size = input<number>(300);

    @ViewChild('chart') chart: ChartComponent;
    public chartOptions: Partial<ChartOptions> = {};
    isDarkMode = signal<boolean>(false);

    constructor(
        private _fuseConfigService: FuseConfigService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.initChart();

        effect(() => {
            this.initChart();
        });
    }

    ngOnInit(): void {
        // Subscribe to the FuseConfigService to get the current theme on component load
        this._fuseConfigService.config$.subscribe((config) => {
            this.isDarkMode.set(config.scheme === 'dark');
            this._changeDetectorRef.detectChanges();
        });
    }

    initChart() {
        this.chartOptions = {
            series: this.series() || [],
            chart: {
                width: this.size(),
                type: 'polarArea',
            },
            labels: this.labels() || [],
            colors: this.colors() || [],
            fill: {
                opacity: 1,
            },
            stroke: {
                width: 1,
                colors: undefined,
            },
            yaxis: {
                show: false,
            },
            legend: {
                position: 'right',
                labels: {
                    colors: this.isDarkMode() ? '#F9FAFB' : '#344054',
                },
            },
            plotOptions: {
                polarArea: {
                    rings: {
                        strokeWidth: 0,
                    },
                },
            },
            theme: {
                monochrome: {
                    //    enabled: true,
                    shadeTo: this.isDarkMode() ? 'dark' : 'light',
                    shadeIntensity: 0.6,
                },
            },
        };
    }
}
