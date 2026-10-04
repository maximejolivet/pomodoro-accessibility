import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { IconsService } from './core/services/icons.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (iconsService: IconsService) => () => iconsService.preloadIcons(),
      deps: [IconsService],
      multi: true
    }
  ]
};
