import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';

// En file:// (app Electron), les URL en chemin ne se rechargent pas : on passe en hash
const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      ...(isFileProtocol ? [withHashLocation()] : []),
    )
  ]
};
