import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;       // em segundos
  milliseconds: number;   // 0 a 999
  cycleCount: number;
  running: boolean;
}

export interface PomodoroConfig {
  focus: number; // em segundos
  shortBreak: number;
  longBreak: number;
}

const CONFIG_KEY = 'flipclock_pomodoro_config';
const HISTORY_KEY = 'flipclock_focus_history';

const DEFAULT_CONFIG: PomodoroConfig = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 20 * 60
};

@Injectable({ providedIn: 'root' })
export class PomodoroService implements OnDestroy {
  private config: PomodoroConfig = this.loadConfig();

  private intervalId?: ReturnType<typeof setInterval>;

  private stateSubject = new BehaviorSubject<PomodoroState>({
    mode: 'focus',
    timeLeft: this.config.focus,
    milliseconds: 0,
    cycleCount: 0,
    running: false
  });

  state$ = this.stateSubject.asObservable();

  get currentState(): PomodoroState {
    return this.stateSubject.value;
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  startPause(): void {
    const state = this.stateSubject.value;

    if (state.running) {
      this.clearTimer();
      this.setState({ ...state, running: false });
    } else {
      this.setState({ ...state, running: true });
      this.intervalId = setInterval(() => this.tick(), 10); // 10ms para centésimos
    }
  }

  reset(): void {
    const state = this.stateSubject.value;
    const duration = this.getDurationByMode(state.mode);

    this.clearTimer();
    this.setState({
      ...state,
      timeLeft: duration,
      milliseconds: 0,
      running: false
    });
  }

  skip(): void {
    const state = this.stateSubject.value;
    this.clearTimer();
    this.completeCycle(state);
  }

  private tick(): void {
    const state = this.stateSubject.value;
    let { timeLeft, milliseconds } = state;

    // Quando acabar tudo
    if (timeLeft <= 0 && milliseconds <= 0) {
      this.clearTimer();
      this.completeCycle(state);
      return;
    }

    // Reduzir tempo
    milliseconds -= 10;
    if (milliseconds < 0) {
      milliseconds = 990;
      timeLeft -= 1;
    }

    this.setState({
      ...state,
      timeLeft,
      milliseconds
    });
  }

  private completeCycle(state: PomodoroState): void {
    let nextMode: PomodoroMode = 'focus';
    let cycleCount = state.cycleCount;

    if (state.mode === 'focus') {
      cycleCount++;
      this.recordFocus(this.config.focus);
      nextMode = cycleCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      this.notify(nextMode === 'longBreak' ? 'Pausa longa!' : 'Pausa curta!', `${cycleCount} pomodoros concluídos. Descanse.`);
    } else {
      nextMode = 'focus';
      this.notify('Hora de focar!', 'Pausa encerrada. Bom estudo.');
    }

    const timeLeft = this.getDurationByMode(nextMode);

    this.setState({
      mode: nextMode,
      timeLeft,
      milliseconds: 0,
      cycleCount,
      running: false
    });
  }

  private notify(title: string, body: string): void {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'icons/icon-192x192.png' });
      }
    } catch { /* ignore */ }
  }

  private recordFocus(seconds: number): void {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(HISTORY_KEY);
      const hist = raw ? JSON.parse(raw) as Record<string, number> : {};
      hist[day] = (hist[day] ?? 0) + Math.round(seconds / 60);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } catch { /* ignore */ }
  }

  private loadConfig(): PomodoroConfig {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw) as Partial<PomodoroConfig>;
      return {
        focus: Math.max(60, Math.round(parsed.focus ?? DEFAULT_CONFIG.focus)),
        shortBreak: Math.max(30, Math.round(parsed.shortBreak ?? DEFAULT_CONFIG.shortBreak)),
        longBreak: Math.max(60, Math.round(parsed.longBreak ?? DEFAULT_CONFIG.longBreak))
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  getConfig(): PomodoroConfig {
    return { ...this.config };
  }

  setConfig(partial: Partial<PomodoroConfig>): void {
    const next = {
      focus: Math.max(60, Math.round(partial.focus ?? this.config.focus)),
      shortBreak: Math.max(30, Math.round(partial.shortBreak ?? this.config.shortBreak)),
      longBreak: Math.max(60, Math.round(partial.longBreak ?? this.config.longBreak))
    };
    this.config = next;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    const state = this.stateSubject.value;
    if (!state.running) {
      this.setState({ ...state, timeLeft: this.getDurationByMode(state.mode), milliseconds: 0 });
    }
  }

  switchMode(mode: PomodoroMode): void {
    this.clearTimer();
    this.setState({
      mode,
      timeLeft: this.getDurationByMode(mode),
      milliseconds: 0,
      cycleCount: this.stateSubject.value.cycleCount,
      running: false
    });
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  private getDurationByMode(mode: PomodoroMode): number {
    return mode === 'focus'
      ? this.config.focus
      : mode === 'shortBreak'
      ? this.config.shortBreak
      : this.config.longBreak;
  }

  private setState(state: PomodoroState): void {
    this.stateSubject.next(state);
  }

  private clearTimer(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
