import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../../services/pomodoro.service';
import { TaskService } from '../../services/task.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  pomodoro = inject(PomodoroService);
  tasks = inject(TaskService);

  pomodoroState = this.pomodoro.currentState;
  taskList: import('../../services/task.service').Task[] = [];
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.pomodoro.state$.subscribe(s => this.pomodoroState = s),
      this.tasks.tasks$.subscribe(t => this.taskList = t)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  get focusHours(): string {
    return (this.totalMinutesAllTime() / 60).toFixed(1);
  }

  get todayMinutes(): number {
    try {
      const raw = localStorage.getItem('flipclock_focus_history');
      if (!raw) return 0;
      const hist = JSON.parse(raw) as Record<string, number>;
      return hist[new Date().toISOString().slice(0, 10)] ?? 0;
    } catch {
      return 0;
    }
  }

  private totalMinutesAllTime(): number {
    try {
      const raw = localStorage.getItem('flipclock_focus_history');
      if (!raw) return this.pomodoroState.cycleCount * Math.round(this.pomodoro.getConfig().focus / 60);
      const hist = JSON.parse(raw) as Record<string, number>;
      const sum = Object.values(hist).reduce((a, b) => a + b, 0);
      return sum > 0 ? sum : this.pomodoroState.cycleCount * Math.round(this.pomodoro.getConfig().focus / 60);
    } catch {
      return 0;
    }
  }

  get doneCount(): number {
    return this.taskList.filter((t) => t.done).length;
  }

  get openCount(): number {
    return this.taskList.filter((t) => !t.done).length;
  }

  get streakLabel(): string {
    const c = this.pomodoroState.cycleCount;
    if (c === 0) return 'Comece agora!';
    if (c < 4) return `${c}/4 até pausa longa`;
    return 'Pausa longa desbloqueada!';
  }
}
