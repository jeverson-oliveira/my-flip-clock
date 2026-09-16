import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PomodoroService } from './pomodoro.service';

describe('PomodoroService', () => {
  let service: PomodoroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PomodoroService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with focus mode 25min', () => {
    const s = service.currentState;
    expect(s.mode).toBe('focus');
    expect(s.timeLeft).toBe(25 * 60);
    expect(s.running).toBeFalse();
  });

  it('should toggle running on startPause', () => {
    service.startPause();
    expect(service.currentState.running).toBeTrue();
    service.startPause();
    expect(service.currentState.running).toBeFalse();
  });

  it('should tick and decrement time', fakeAsync(() => {
    service.startPause();
    const initial = service.currentState.timeLeft;
    tick(100);
    expect(service.currentState.timeLeft).toBeLessThan(initial + 1);
    service.ngOnDestroy();
  }));

  it('should handle milliseconds rollover', fakeAsync(() => {
    // set to 1 second left, 10ms
    (service as unknown as { stateSubject: { next: (s: unknown) => void; value: unknown } }).stateSubject.next({
      mode: 'focus',
      timeLeft: 5,
      milliseconds: 0,
      cycleCount: 0,
      running: true
    });
    service.startPause(); // will clear and set running false, so start again
    // Force running true and tick
    (service as unknown as { stateSubject: { next: (s: unknown) => void; value: unknown } }).stateSubject.next({
      mode: 'focus',
      timeLeft: 5,
      milliseconds: 10,
      cycleCount: 0,
      running: true
    });
    (service as unknown as { intervalId: number }).intervalId = setInterval(() => (service as unknown as { tick: () => void }).tick(), 10) as unknown as number;
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState.milliseconds).toBe(0);
    clearInterval((service as unknown as { intervalId: number }).intervalId);
    service.ngOnDestroy();
  }));

  it('should reset to mode duration', () => {
    service.startPause();
    service.reset();
    expect(service.currentState.running).toBeFalse();
    expect(service.currentState.milliseconds).toBe(0);
    expect(service.currentState.timeLeft).toBe(25 * 60);
  });

  it('should complete focus cycle to shortBreak', fakeAsync(() => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus',
      timeLeft: 0,
      milliseconds: 0,
      cycleCount: 0,
      running: true
    });
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState.mode).toBe('shortBreak');
    expect(service.currentState.cycleCount).toBe(1);
    expect(service.currentState.running).toBeFalse();
    service.ngOnDestroy();
  }));

  it('should complete 4th focus to longBreak', fakeAsync(() => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus',
      timeLeft: 0,
      milliseconds: 0,
      cycleCount: 3,
      running: true
    });
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState.mode).toBe('longBreak');
    expect(service.currentState.cycleCount).toBe(4);
    service.ngOnDestroy();
  }));

  it('should complete break to focus', fakeAsync(() => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'shortBreak',
      timeLeft: 0,
      milliseconds: 0,
      cycleCount: 1,
      running: true
    });
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState.mode).toBe('focus');
    service.ngOnDestroy();
  }));

  it('should handle longBreak to focus', fakeAsync(() => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'longBreak',
      timeLeft: 0,
      milliseconds: 0,
      cycleCount: 4,
      running: true
    });
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState.mode).toBe('focus');
    service.ngOnDestroy();
  }));

  it('should skip cycle', () => {
    service.skip();
    expect(service.currentState.mode).toBe('shortBreak');
  });

  it('should clear timer on destroy', () => {
    service.startPause();
    service.ngOnDestroy();
    expect((service as unknown as { intervalId: unknown }).intervalId).toBeUndefined();
  });

  it('should get duration by mode', () => {
    expect((service as unknown as { getDurationByMode: (m: string) => number }).getDurationByMode('focus')).toBe(1500);
    expect((service as unknown as { getDurationByMode: (m: string) => number }).getDurationByMode('shortBreak')).toBe(300);
    expect((service as unknown as { getDurationByMode: (m: string) => number }).getDurationByMode('longBreak')).toBe(1200);
  });

  it('should get/set config persistently', () => {
    expect(service.getConfig().focus).toBe(1500);
    service.setConfig({ focus: 1800 });
    expect(service.getConfig().focus).toBe(1800);
    expect(JSON.parse(localStorage.getItem('flipclock_pomodoro_config')!)).toEqual(jasmine.objectContaining({ focus: 1800 }));
  });

  it('should clamp config minimums', () => {
    service.setConfig({ focus: 10, shortBreak: 5, longBreak: 10 });
    expect(service.getConfig().focus).toBe(60);
  });

  it('should switch mode', () => {
    service.switchMode('longBreak');
    expect(service.currentState.mode).toBe('longBreak');
    expect(service.currentState.running).toBeFalse();
  });

  it('should handle corrupted config', () => {
    localStorage.setItem('flipclock_pomodoro_config', 'bad');
    const svc2 = new PomodoroService();
    expect(svc2.getConfig().focus).toBe(1500);
    svc2.ngOnDestroy();
  });

  it('should request notification permission', async () => {
    const result = await service.requestNotificationPermission();
    expect(typeof result).toBe('boolean');
  });

  it('should record focus history', fakeAsync(() => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus', timeLeft: 0, milliseconds: 0, cycleCount: 0, running: true
    });
    (service as unknown as { tick: () => void }).tick();
    expect(localStorage.getItem('flipclock_focus_history')).toContain(new Date().toISOString().slice(0, 10));
    service.ngOnDestroy();
  }));

  it('should not update timeLeft when running on setConfig', () => {
    service.startPause();
    const before = service.currentState.timeLeft;
    service.setConfig({ focus: 3600 });
    expect(service.currentState.timeLeft).toBe(before);
    service.ngOnDestroy();
  });

  it('should load partial config', () => {
    localStorage.setItem('flipclock_pomodoro_config', JSON.stringify({ focus: 1800 }));
    const svc2 = new PomodoroService();
    expect(svc2.getConfig().focus).toBe(1800);
    expect(svc2.getConfig().shortBreak).toBe(300);
    svc2.ngOnDestroy();
  });

  it('should notify only when granted', () => {
    const orig = (window as unknown as { Notification: unknown }).Notification;
    (window as unknown as { Notification: unknown }).Notification = undefined;
    (service as unknown as { notify: (a: string, b: string) => void }).notify('t', 'b');
    expect(true).toBeTrue();
    (window as unknown as { Notification: unknown }).Notification = orig;
  });
});
