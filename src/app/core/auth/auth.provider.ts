import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, Provider } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';

export const provideAuth = (): Array<Provider | EnvironmentProviders> =>
{
    return [
        // NOTE: authInterceptor is already registered in appConfig's provideHttpClient.
        // Registering it here again would cause double interception on every HTTP request.
        {
            provide : ENVIRONMENT_INITIALIZER,
            useValue: () => inject(AuthService),
            multi   : true,
        },
    ];
};
