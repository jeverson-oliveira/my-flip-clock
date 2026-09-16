import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsComponent } from './stats.component';
import { TaskService } from '../../services/task.service';
import { PomodoroState } from '../../services/pomodoro.service';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [StatsComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute focusHours', () => {
    (component as unknown as { pomodoroState: PomodoroState }).pomodoroState = { cycleCount: 4, mode: 'focus', timeLeft: 0, milliseconds: 0, running: false } as PomodoroState;
    expect(component.focusHours).toBe('1.7');
  });

  it('should count done/open', () => {
    const svc = TestBed.inject(TaskService);
    svc.add('A');
    svc.add('B');
    svc.toggle(svc.tasks[0].id);
    fixture.detectChanges();
    expect(component.doneCount).toBe(1);
    expect(component.openCount).toBe(1);
  });

  it('should return streak labels', () => {
    (component as unknown as { pomodoroState: PomodoroState }).pomodoroState = { cycleCount: 0, mode: 'focus', timeLeft: 0, milliseconds: 0, running: false } as PomodoroState;
    expect(component.streakLabel).toBe('Comece agora!');
    (component as unknown as { pomodoroState: PomodoroState }).pomodoroState = { cycleCount: 2, mode: 'focus', timeLeft: 0, milliseconds: 0, running: false } as PomodoroState;
    expect(component.streakLabel).toContain('até pausa longa');
    (component as unknown as { pomodoroState: PomodoroState }).pomodoroState = { cycleCount: 4, mode: 'focus', timeLeft: 0, milliseconds: 0, running: false } as PomodoroState;
    expect(component.streakLabel).toBe('Pausa longa desbloqueada!');
  });

  it('should unsubscribe on destroy', () => {
    const spy = spyOn((component as unknown as { subs: { forEach: (fn: (s: { unsubscribe: () => void }) => void) => void } }).subs, 'forEach');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });

  it('should render stats', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stats-grid')).toBeTruthy();
  });

  it('should compute todayMinutes and total with history', () => {
    localStorage.setItem('flipclock_focus_history', JSON.stringify({ [new Date().toISOString().slice(0, 10)]: 50 }));
    fixture.detectChanges();
    expect(component.todayMinutes).toBe(50);
    expect(component.focusHours).toBe((50 / 60).toFixed(1));
  });

  it('should handle empty history fallback', () => {
    localStorage.removeItem('flipclock_focus_history');
    (component as unknown as { pomodoroState: PomodoroState }).pomodoroState = { cycleCount: 2, mode: 'focus', timeLeft: 0, milliseconds: 0, running: false } as PomodoroState;
    expect(component.todayMinutes).toBe(0);
  });
});
