import { NgIf } from '@angular/common';
import {
    Component,
    OnInit,
    signal,
    ViewChild,
    ViewEncapsulation,
    WritableSignal,
} from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { DataService, MessageIds } from 'app/services/data.service';
import { SnackbarComponent } from 'app/widgets/snackbar/snackbar.component';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        FuseAlertComponent,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        SnackbarComponent,
    ],
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    createUserForm: UntypedFormGroup;
    forgotPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;

    showCreateUser: WritableSignal<boolean> = signal<boolean>(false);
    showForgotPassword: WritableSignal<boolean> = signal<boolean>(false);

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _dataService: DataService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            username: ['admin', [Validators.required]],
            password: ['admin', Validators.required],
            rememberMe: [''],
        });

        this.createUserForm = this._formBuilder.group({
            firstName: ['', [Validators.required, Validators.maxLength(255)]],
            lastName: ['', [Validators.required, Validators.maxLength(255)]],
            email: ['', [Validators.required, Validators.email]],
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        });

        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value).subscribe(
            () => {
                // Set the redirect url.
                // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                // to the correct page after a successful sign in. This way, that url can be set via
                // routing file and we don't have to touch here.
                const redirectURL =
                    this._activatedRoute.snapshot.queryParamMap.get(
                        'redirectURL'
                    ) || '/signed-in-redirect';

                // Navigate to the redirect url
                this._router.navigateByUrl(redirectURL);
            },
            (response) => {
                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: 'Wrong email or password',
                };

                // Show the alert
                this.showAlert = true;
            }
        );
    }

    /**
     * Create user
     */
    createUser(): void {
        console.log(this.createUserForm.value);
    }

    /**
     * Send forgot password
     */
    sendForgotPassword(): void {
        this._authService
            .forgotPassword(this.forgotPasswordForm.get('email').value)
            .subscribe({
                next: () => {
                    this._dataService.changeMessage({
                        id: MessageIds.SNACKBAR_TRIGGERED,
                        data: {
                            type: 'info',
                            description:
                                "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
                        },
                    });
                },
                error: () => {
					this._dataService.changeMessage({
						id: MessageIds.SNACKBAR_TRIGGERED,
						data: {
							type: 'error',
							description: 'Something went wrong, please try again.',
						},
					});
				},
            });
    }
}
