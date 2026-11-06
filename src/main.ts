import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { applyHostClass, isTauriHost } from './app/core/platform';

applyHostClass();

// No Tauri o app abre direto no mini widget.
if (isTauriHost() && !location.hash) {
  location.hash = '#/widget';
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
