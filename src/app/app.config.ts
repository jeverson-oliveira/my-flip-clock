import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { usesHashRouting } from './core/platform';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes, ...(usesHashRouting() ? [withHashLocation()] : [])),
    provideServiceWorker('ngsw-worker.js', {
      // Extensão e widget não têm service worker: o registro daria 404 e
      // cachearia o app de forma indesejada.
      enabled: !isDevMode() && !usesHashRouting(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
