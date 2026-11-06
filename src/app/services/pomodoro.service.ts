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

interface PersistedPomodoro {
  mode: PomodoroMode;
  cycleCount: number;
  millisLeft: number;
  running: boolean;
  savedAt: number;
}

const CONFIG_KEY = 'flipclock_pomodoro_config';
const HISTORY_KEY = 'flipclock_focus_history';
const STATE_KEY = 'flipclock_pomodoro_state';

const DEFAULT_CONFIG: PomodoroConfig = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 20 * 60
};

@Injectable({ providedIn: 'root' })
export class PomodoroService implements OnDestroy {
  private config: PomodoroConfig = this.loadConfig();

  private intervalId?: ReturnType<typeof setInterval>;

  // Instante (epoch ms) em que o ciclo atual termina. O tempo restante é
  // sempre calculado a partir dele, então o timer continua correto mesmo
  // com a aba em segundo plano (onde setInterval é desacelerado).
  private endTime: number | null = null;

  private stateSubject = new BehaviorSubject<PomodoroState>({
    mode: 'focus',
    timeLeft: this.config.focus,
    milliseconds: 0,
    cycleCount: 0,
    running: false
  });

  state$ = this.stateSubject.asObservable();

  private readonly onVisibilityChange = (): void => {
    if (typeof document !== 'undefined' && document.hidden) {
      this.persist();
    } else {
      this.tick();
    }
  };

  private readonly onBeforeUnload = (): void => this.persist();

  constructor() {
    this.restore();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.onBeforeUnload);
    }
  }

  get currentState(): PomodoroState {
    return this.stateSubject.value;
  }

  ngOnDestroy(): void {
    this.clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.onBeforeUnload);
    }
  }

  startPause(): void {
    const state = this.stateSubject.value;

    if (state.running) {
      const { timeLeft, milliseconds } = this.splitRemaining(this.remainingMs());
      this.clearTimer();
      this.endTime = null;
      this.setState({ ...state, timeLeft, milliseconds, running: false });
      this.persist();
      return;
    }

    const remaining = state.timeLeft * 1000 + state.milliseconds;
    if (remaining <= 0) return;

    this.endTime = Date.now() + remaining;
    this.setState({ ...state, running: true });
    this.startTicker();
    this.persist();
  }

  reset(): void {
    const state = this.stateSubject.value;
    const duration = this.getDurationByMode(state.mode);

    this.clearTimer();
    this.endTime = null;
    this.setState({
      ...state,
      timeLeft: duration,
      milliseconds: 0,
      running: false
    });
    this.persist();
  }

  skip(): void {
    const state = this.stateSubject.value;
    this.clearTimer();
    this.endTime = null;
    this.completeCycle(state);
  }

  private tick(): void {
    const state = this.stateSubject.value;
    if (!state.running) return;

    const remaining = this.remainingMs();

    if (remaining <= 0) {
      this.clearTimer();
      this.endTime = null;
      this.completeCycle(state);
      return;
    }

    const { timeLeft, milliseconds } = this.splitRemaining(remaining);
    this.setState({ ...state, timeLeft, milliseconds });
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
    this.persist();
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
    this.persist();
  }

  switchMode(mode: PomodoroMode): void {
    this.clearTimer();
    this.endTime = null;
    this.setState({
      mode,
      timeLeft: this.getDurationByMode(mode),
      milliseconds: 0,
      cycleCount: this.stateSubject.value.cycleCount,
      running: false
    });
    this.persist();
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

  private remainingMs(): number {
    if (this.endTime !== null) {
      return Math.max(0, this.endTime - Date.now());
    }
    const state = this.stateSubject.value;
    return Math.max(0, state.timeLeft * 1000 + state.milliseconds);
  }

  private splitRemaining(ms: number): { timeLeft: number; milliseconds: number } {
    const safe = Math.max(0, Math.floor(ms));
    return { timeLeft: Math.floor(safe / 1000), milliseconds: safe % 1000 };
  }

  private startTicker(): void {
    this.clearTimer();
    this.intervalId = setInterval(() => this.tick(), 10);
  }

  private persist(): void {
    try {
      const state = this.stateSubject.value;
      const millisLeft = state.running ? this.remainingMs() : state.timeLeft * 1000 + state.milliseconds;
      const payload: PersistedPomodoro = {
        mode: state.mode,
        cycleCount: state.cycleCount,
        millisLeft,
        running: state.running,
        savedAt: Date.now()
      };
      localStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch { /* ignore */ }
  }

  private restore(): void {
    const saved = this.loadPersisted();
    if (!saved) return;

    const elapsed = saved.running ? Math.max(0, Date.now() - saved.savedAt) : 0;
    const remaining = Math.max(0, saved.millisLeft - elapsed);
    const { timeLeft, milliseconds } = this.splitRemaining(remaining);

    const base: PomodoroState = {
      mode: saved.mode,
      timeLeft,
      milliseconds,
      cycleCount: saved.cycleCount,
      running: false
    };

    if (saved.running && remaining > 0) {
      this.endTime = Date.now() + remaining;
      this.setState({ ...base, running: true });
      this.startTicker();
      return;
    }

    if (saved.running) {
      // O ciclo terminou enquanto a página estava fechada: fecha o ciclo.
      this.setState({ ...base, running: true });
      this.completeCycle(this.stateSubject.value);
      return;
    }

    this.setState(base);
  }

  private loadPersisted(): PersistedPomodoro | null {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PersistedPomodoro>;
      const mode = parsed.mode;
      const validMode = mode === 'focus' || mode === 'shortBreak' || mode === 'longBreak';
      if (!validMode || typeof parsed.millisLeft !== 'number' || !Number.isFinite(parsed.millisLeft)) {
        return null;
      }
      return {
        mode: mode as PomodoroMode,
        cycleCount: Math.max(0, Math.round(parsed.cycleCount ?? 0)),
        millisLeft: Math.max(0, parsed.millisLeft),
        running: parsed.running === true,
        savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now()
      };
    } catch {
      return null;
    }
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
