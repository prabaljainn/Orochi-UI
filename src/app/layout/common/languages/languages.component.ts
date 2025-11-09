import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'languages',
    templateUrl: './languages.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'languages',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, MatIconModule],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    languageList = [
        {
            code: 'en',
            icon: 'flags:en',
            name: $localize`English`,
        },
        {
            code: 'ja',
            icon: 'flags:ja',
            name: $localize`Japanese`,
        },
		{
            code: 'hi',
            icon: 'flags:hi',
            name: $localize`Hindi`,
        },
    ];
    supportedLanguages: string[] = this.languageList.map((lang) => lang.code);
    languageOption: string = 'en';

    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {}

    /**
     * On destroy
     */
    ngOnDestroy(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    changeLanguage() {
        const language = this.supportedLanguages.includes(this.languageOption)
            ? this.languageOption
            : 'en';

        //Skip any language changes if running locally
        if (window.location.hostname !== 'localhost') {
            let currentLanguage = 'en';
            this.supportedLanguages.forEach((lang) => {
                let re = new RegExp(`/${lang}/`, 'g');
                if (re.test(window.location.href)) {
                    currentLanguage = lang;
                    //console.log('currentLanguage set to ', currentLanguage);
                }
            });

            //0) Check if the currently loaded language is the same as what is requested
            if (language != currentLanguage) {
                console.log(
                    'Switching the language from ',
                    currentLanguage,
                    ' to ',
                    language
                );
                //1) Set the preference to local storage
                localStorage.setItem('userPreference', language);

                //2) Update logged in user's language preference
                // this.userinfo.meta['langKey'] = language;
                // this._userService.updateUserMeta(this.userinfo.meta).subscribe((resp) => {
                //     //console.log('resp', resp);
                // });

                //3) Reload the page with the chosen language
                const originalurl = window.location.href;
                let modifiedurl = originalurl;
                
                // First, try to replace any existing language code
                let hasLanguageCode = false;
                this.supportedLanguages.forEach((lang) => {
                    let re = new RegExp(`/${lang}/`, 'g');
                    if (re.test(modifiedurl)) {
                        hasLanguageCode = true;
                        modifiedurl = modifiedurl.replace(
                            '/' + lang + '/',
                            '/' + language + '/'
                        );
                    }
                });
                
                // If no language code was found, add it after the domain
                if (!hasLanguageCode) {
                    const url = new URL(modifiedurl);
                    const pathParts = url.pathname.split('/').filter(part => part);
                    
                    // Insert language code after the first path segment (e.g., after 'dashboard')
                    if (pathParts.length > 0) {
                        pathParts.splice(1, 0, language);
                    } else {
                        pathParts.push(language);
                    }
                    
                    url.pathname = '/' + pathParts.join('/') + '/';
                    modifiedurl = url.toString();
                }
                
                if (originalurl !== modifiedurl) {
                    window.location.href = modifiedurl;
                }
            }
        }
        //this._changeDetectorRef.markForCheck();
    }

    handleLanguageSelection(lng: string) {
        this.languageOption = lng;
        this.changeLanguage();
    }
}
