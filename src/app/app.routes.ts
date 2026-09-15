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
  {
    path: 'tarefas',
    loadComponent: () =>
      import('./components/task-list/task-list.component').then(m => m.TaskListComponent)
  },
  {
    path: 'estatisticas',
    loadComponent: () =>
      import('./components/stats/stats.component').then(m => m.StatsComponent)
  },
  {
    path: 'foco',
    loadComponent: () =>
      import('./components/focus-sounds/focus-sounds.component').then(m => m.FocusSoundsComponent)
  },
  { path: '**', redirectTo: '' }
];
