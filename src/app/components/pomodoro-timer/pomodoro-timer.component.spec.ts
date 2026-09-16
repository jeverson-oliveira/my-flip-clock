import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PomodoroTimerComponent } from './pomodoro-timer.component';
import { PomodoroService } from '../../services/pomodoro.service';

describe('PomodoroTimerComponent', () => {
  let component: PomodoroTimerComponent;
  let fixture: ComponentFixture<PomodoroTimerComponent>;
  let service: PomodoroService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroTimerComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(PomodoroTimerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(PomodoroService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    service.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init state from service', () => {
    expect(component.state).toEqual(service.currentState);
  });

  it('should return label for each mode', () => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus', timeLeft: 1500, milliseconds: 0, cycleCount: 0, running: false
    });
    fixture.detectChanges();
    expect(component.label).toBe('Foco');

    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'shortBreak', timeLeft: 300, milliseconds: 0, cycleCount: 1, running: false
    });
    fixture.detectChanges();
    expect(component.label).toBe('Pausa Curta');

    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'longBreak', timeLeft: 1200, milliseconds: 0, cycleCount: 4, running: false
    });
    fixture.detectChanges();
    expect(component.label).toBe('Pausa Longa');
  });

  it('should format time mm:ss:cc', () => {
    (service as unknown as { stateSubject: { next: (s: unknown) => void } }).stateSubject.next({
      mode: 'focus', timeLeft: 65, milliseconds: 120, cycleCount: 0, running: true
    });
    fixture.detectChanges();
    expect(component.formattedTime).toBe('01:05:12');
  });

  it('should call service startPause and reset', () => {
    const spyStart = spyOn(service, 'startPause');
    const spyReset = spyOn(service, 'reset');
    component.startPause();
    expect(spyStart).toHaveBeenCalled();
    component.reset();
    expect(spyReset).toHaveBeenCalled();
  });

  it('should render controls and info', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.controls')).toBeTruthy();
    expect(compiled.querySelector('.pomodoro-info')).toBeTruthy();
  });

  it('should unsubscribe on destroy', () => {
    const sub = (component as unknown as { sub: { unsubscribe: () => void } }).sub;
    const spy = spyOn(sub, 'unsubscribe');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should switch mode and save settings', () => {
    const spySwitch = spyOn(service, 'switchMode');
    component.switchMode('shortBreak');
    expect(spySwitch).toHaveBeenCalledWith('shortBreak');
    component.focusMin = 30;
    component.shortMin = 10;
    component.longMin = 30;
    component.saveSettings();
    expect(service.getConfig().focus).toBe(1800);
    expect(component.showSettings).toBeFalse();
  });

  it('should request notifications', () => {
    const spy = spyOn(service, 'requestNotificationPermission');
    component.enableNotifications();
    expect(spy).toHaveBeenCalled();
  });
});
