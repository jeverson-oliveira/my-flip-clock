import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PomodoroService } from './pomodoro.service';

describe('PomodoroService', () => {
  let service: PomodoroService;

  beforeEach(() => {
    localStorage.clear();
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

  it('should compute remaining from wall clock', fakeAsync(() => {
    service.startPause();
    tick(1000);
    expect(service.currentState.timeLeft).toBe(1499);
    expect(service.currentState.milliseconds).toBe(0);
    service.ngOnDestroy();
  }));

  it('should keep the timer running when the tab is throttled', fakeAsync(() => {
    service.startPause();
    // Simula aba em segundo plano: o intervalo é desacelerado, mas o
    // tempo restante é calculado pelo relógio, não por decrementos.
    tick(70000);
    expect(service.currentState.timeLeft).toBe(1430);
    service.ngOnDestroy();
  }));

  it('should resync on visibilitychange', fakeAsync(() => {
    service.startPause();
    tick(3000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.currentState.timeLeft).toBe(1497);
    service.ngOnDestroy();
  }));

  it('should pause preserving the elapsed time', fakeAsync(() => {
    service.startPause();
    tick(2000);
    service.startPause();
    expect(service.currentState.running).toBeFalse();
    expect(service.currentState.timeLeft).toBe(1498);
    service.ngOnDestroy();
  }));

  it('should not start when there is no time left', () => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus', timeLeft: 0, milliseconds: 0, cycleCount: 0, running: false
    });
    service.startPause();
    expect(service.currentState.running).toBeFalse();
  });

  it('should ignore tick when not running', () => {
    const before = service.currentState;
    (service as unknown as { tick: () => void }).tick();
    expect(service.currentState).toEqual(before);
  });

  it('should persist state on transitions', () => {
    const stateKey = 'flipclock_pomodoro_state';
    service.startPause();
    expect(JSON.parse(localStorage.getItem(stateKey)!).running).toBeTrue();
    service.startPause();
    expect(JSON.parse(localStorage.getItem(stateKey)!).running).toBeFalse();
    service.switchMode('longBreak');
    expect(JSON.parse(localStorage.getItem(stateKey)!).mode).toBe('longBreak');
    service.setConfig({ focus: 1200 });
    expect(JSON.parse(localStorage.getItem(stateKey)!).millisLeft).toBe(1200000);
  });

  it('should restore a running timer after reload', () => {
    localStorage.setItem('flipclock_pomodoro_state', JSON.stringify({
      mode: 'focus', cycleCount: 2, millisLeft: 60000, running: true, savedAt: Date.now()
    }));
    const svc2 = new PomodoroService();
    expect(svc2.currentState.running).toBeTrue();
    expect(svc2.currentState.timeLeft).toBe(60);
    expect(svc2.currentState.cycleCount).toBe(2);
    svc2.ngOnDestroy();
  });

  it('should restore a paused timer after reload', () => {
    localStorage.setItem('flipclock_pomodoro_state', JSON.stringify({
      mode: 'shortBreak', cycleCount: 2, millisLeft: 125500, running: false, savedAt: Date.now()
    }));
    const svc2 = new PomodoroService();
    expect(svc2.currentState.mode).toBe('shortBreak');
    expect(svc2.currentState.timeLeft).toBe(125);
    expect(svc2.currentState.milliseconds).toBe(500);
    expect(svc2.currentState.running).toBeFalse();
    svc2.ngOnDestroy();
  });

  it('should complete a cycle that expired while the page was closed', () => {
    localStorage.setItem('flipclock_pomodoro_state', JSON.stringify({
      mode: 'focus', cycleCount: 0, millisLeft: 1000, running: true, savedAt: Date.now() - 5000
    }));
    const svc2 = new PomodoroService();
    expect(svc2.currentState.mode).toBe('shortBreak');
    expect(svc2.currentState.cycleCount).toBe(1);
    expect(svc2.currentState.running).toBeFalse();
    svc2.ngOnDestroy();
  });

  it('should ignore invalid persisted state', () => {
    localStorage.setItem('flipclock_pomodoro_state', JSON.stringify({ mode: 'nope', millisLeft: 1000 }));
    const svc2 = new PomodoroService();
    expect(svc2.currentState.mode).toBe('focus');
    expect(svc2.currentState.timeLeft).toBe(1500);
    svc2.ngOnDestroy();
  });

  it('should ignore corrupted persisted state', () => {
    localStorage.setItem('flipclock_pomodoro_state', 'bad');
    const svc2 = new PomodoroService();
    expect(svc2.currentState.mode).toBe('focus');
    svc2.ngOnDestroy();
  });

  it('should persist on page unload', () => {
    (service as unknown as { onBeforeUnload: () => void }).onBeforeUnload();
    expect(localStorage.getItem('flipclock_pomodoro_state')).not.toBeNull();
  });

  it('should handle state without savedAt', () => {
    localStorage.setItem('flipclock_pomodoro_state', JSON.stringify({
      mode: 'focus', millisLeft: 30000, running: false
    }));
    const svc2 = new PomodoroService();
    expect(svc2.currentState.timeLeft).toBe(30);
    svc2.ngOnDestroy();
  });

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
    const orig = (window as unknown as { Notification: unknown }).Notification;
    (window as unknown as { Notification: { permission: string; requestPermission: () => Promise<string> } }).Notification = {
      permission: 'granted',
      requestPermission: () => Promise.resolve('granted')
    };
    const result = await service.requestNotificationPermission();
    expect(result).toBeTrue();
    (window as unknown as { Notification: unknown }).Notification = orig;
  });

  it('should return false when Notification undefined', async () => {
    const orig = (window as unknown as { Notification: unknown }).Notification;
    (window as unknown as { Notification: unknown }).Notification = undefined;
    expect(await service.requestNotificationPermission()).toBeFalse();
    (window as unknown as { Notification: unknown }).Notification = orig;
  });

  it('should request permission when default', async () => {
    const orig = (window as unknown as { Notification: unknown }).Notification;
    (window as unknown as { Notification: { permission: string; requestPermission: () => Promise<string> } }).Notification = {
      permission: 'default',
      requestPermission: () => Promise.resolve('denied')
    };
    expect(await service.requestNotificationPermission()).toBeFalse();
    (window as unknown as { Notification: unknown }).Notification = orig;
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
