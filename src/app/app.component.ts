import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SnackbarComponent } from './widgets/snackbar/snackbar.component';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss'],
    standalone : true,
    imports    : [RouterOutlet, SnackbarComponent],
})
export class AppComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
