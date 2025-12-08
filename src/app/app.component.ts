import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnackbarComponent } from './widgets/snackbar/snackbar.component';
import { FontSizeService } from './services/font-size.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet, SnackbarComponent],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(private fontService: FontSizeService) {}

    ngOnInit() {
        this.fontService.loadSavedPreference();
    }
}
