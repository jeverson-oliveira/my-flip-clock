import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PomodoroMode, PomodoroService, PomodoroState } from '../../services/pomodoro.service';
import { hideTauriWindow } from '../../core/platform';

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css']
})
export class WidgetComponent implements OnInit, OnDestroy {
  private pomodoro = inject(PomodoroService);
  private sub?: Subscription;
  private clockId?: ReturnType<typeof setInterval>;

  state: PomodoroState = this.pomodoro.currentState;
  now = new Date();

  ngOnInit(): void {
    this.sub = this.pomodoro.state$.subscribe(s => (this.state = s));
    this.clockId = setInterval(() => (this.now = new Date()), 1000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.clockId !== undefined) {
      clearInterval(this.clockId);
    }
  }

  get clock(): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(this.now.getHours())}:${pad(this.now.getMinutes())}:${pad(this.now.getSeconds())}`;
  }

  get date(): string {
    return this.now.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  }

  get modeLabel(): string {
    return this.state.mode === 'focus' ? 'Foco' : this.state.mode === 'shortBreak' ? 'Pausa' : 'Pausa longa';
  }

  get pomodoroTime(): string {
    const minutes = Math.floor(this.state.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (this.state.timeLeft % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  get progress(): number {
    const total = this.duration(this.state.mode);
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((total - this.state.timeLeft) / total) * 100));
  }

  get cycles(): number[] {
    return Array.from({ length: 4 }, (_, i) => i);
  }

  toggle(): void {
    this.pomodoro.startPause();
  }

  reset(): void {
    this.pomodoro.reset();
  }

  async hide(): Promise<void> {
    await hideTauriWindow();
  }

  private duration(mode: PomodoroMode): number {
    const config = this.pomodoro.getConfig();
    return mode === 'focus' ? config.focus : mode === 'shortBreak' ? config.shortBreak : config.longBreak;
  }
}
