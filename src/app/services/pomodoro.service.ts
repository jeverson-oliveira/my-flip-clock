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

@Injectable({ providedIn: 'root' })
export class PomodoroService implements OnDestroy {
  private readonly FOCUS_DURATION = 25 * 60;      // 25 minutos
  private readonly SHORT_BREAK = 5 * 60;          // 5 minutos
  private readonly LONG_BREAK = 20 * 60;          // 20 minutos

  private intervalId?: ReturnType<typeof setInterval>;

  private stateSubject = new BehaviorSubject<PomodoroState>({
    mode: 'focus',
    timeLeft: this.FOCUS_DURATION,
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
      nextMode = cycleCount % 4 === 0 ? 'longBreak' : 'shortBreak';
    } else {
      nextMode = 'focus';
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

  private getDurationByMode(mode: PomodoroMode): number {
    return mode === 'focus'
      ? this.FOCUS_DURATION
      : mode === 'shortBreak'
      ? this.SHORT_BREAK
      : this.LONG_BREAK;
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
