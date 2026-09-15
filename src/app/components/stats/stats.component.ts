import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroService } from '../../services/pomodoro.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  pomodoro = inject(PomodoroService);
  tasks = inject(TaskService);

  pomodoroState = this.pomodoro.currentState;
  taskList: import('../../services/task.service').Task[] = [];

  ngOnInit(): void {
    this.pomodoro.state$.subscribe(s => this.pomodoroState = s);
    this.tasks.tasks$.subscribe(t => this.taskList = t);
  }

  get focusHours(): string {
    const minutes = this.pomodoroState.cycleCount * 25;
    return (minutes / 60).toFixed(1);
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
