import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PomodoroService, PomodoroState } from '../../services/pomodoro.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pomodoro-timer.component.html',
  styleUrls: ['./pomodoro-timer.component.css']
})
export class PomodoroTimerComponent implements OnInit, OnDestroy {
  state: PomodoroState;
  private sub?: Subscription;

  private pomodoro = inject(PomodoroService);

  focusMin = 25;
  shortMin = 5;
  longMin = 20;
  showSettings = false;

  constructor() {
    this.state = this.pomodoro.currentState;
    const cfg = this.pomodoro.getConfig();
    this.focusMin = Math.round(cfg.focus / 60);
    this.shortMin = Math.round(cfg.shortBreak / 60);
    this.longMin = Math.round(cfg.longBreak / 60);
  }

  ngOnInit(): void {
    this.sub = this.pomodoro.state$.subscribe(s => this.state = s);
  }

  get label(): string {
    const m = this.state.mode;
    return m === 'focus' ? 'Foco' : m === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa';
  }

  get formattedTime(): string {
    const total = this.state.timeLeft * 1000 + this.state.milliseconds;
    const minutes = Math.floor(total / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((total % 60000) / 1000).toString().padStart(2, '0');
    const centiseconds = Math.floor((total % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}:${centiseconds}`;
  }

  startPause(): void {
    this.pomodoro.startPause();
  }

  reset(): void {
    this.pomodoro.reset();
  }

  switchMode(mode: PomodoroState['mode']): void {
    this.pomodoro.switchMode(mode);
  }

  saveSettings(): void {
    this.pomodoro.setConfig({
      focus: this.focusMin * 60,
      shortBreak: this.shortMin * 60,
      longBreak: this.longMin * 60
    });
    this.showSettings = false;
  }

  enableNotifications(): void {
    void this.pomodoro.requestNotificationPermission();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
