import { Component, effect, input, ViewChild } from '@angular/core';
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
    public chartOptions: Partial<ChartOptions>;

    constructor() {
		effect(() => {
			this.initChart();
		});
    }

	ngOnInit(): void {
		this.initChart();
	}

	initChart() {
		this.chartOptions = {
            series: this.series(),
            chart: {
                width: this.size(),
                type: 'polarArea',
            },
            labels: this.labels(),
			colors: this.colors(),
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
                    shadeTo: 'light',
                    shadeIntensity: 0.6,
                },
            },
        };
	}
}
