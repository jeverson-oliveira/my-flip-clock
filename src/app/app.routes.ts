import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/flip-clock/flip-clock.component').then(m => m.FlipClockComponent)
  },
  {
    path: 'pomodoro',
    loadComponent: () =>
      import('./components/pomodoro-timer/pomodoro-timer.component').then(m => m.PomodoroTimerComponent)
  },
  { path: '**', redirectTo: '' }
];
