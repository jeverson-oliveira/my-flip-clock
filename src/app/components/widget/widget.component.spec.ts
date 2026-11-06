import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';
import { PomodoroService } from '../../services/pomodoro.service';

describe('WidgetComponent', () => {
  let component: WidgetComponent;
  let fixture: ComponentFixture<WidgetComponent>;
  let service: PomodoroService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [WidgetComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(WidgetComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(PomodoroService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    service.ngOnDestroy();
    localStorage.clear();
    delete (window as unknown as { __TAURI__?: unknown }).__TAURI__;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render clock, date and pomodoro', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.widget-clock')?.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(el.querySelector('.widget-date')?.textContent?.length).toBeGreaterThan(3);
    expect(el.querySelector('.pomo-time')?.textContent).toBe('25:00');
    expect(el.querySelector('.mode-label')?.textContent).toContain('Foco');
  });

  it('should toggle and reset the pomodoro', () => {
    component.toggle();
    expect(service.currentState.running).toBeTrue();
    component.toggle();
    expect(service.currentState.running).toBeFalse();
    component.reset();
    expect(service.currentState.timeLeft).toBe(25 * 60);
  });

  it('should compute progress and mode labels', () => {
    expect(component.progress).toBe(0);
    service.switchMode('shortBreak');
    expect(component.modeLabel).toBe('Pausa');
    service.switchMode('longBreak');
    expect(component.modeLabel).toBe('Pausa longa');
    expect(component.cycles.length).toBe(4);
  });

  it('should start a clock interval', () => {
    expect((component as unknown as { clockId: unknown }).clockId).toBeDefined();
  });

  it('should format the clock and date', () => {
    component.now = new Date(2024, 0, 5, 9, 5, 7);
    expect(component.clock).toBe('09:05:07');
    expect(component.date.toLowerCase()).toContain('05');
  });

  it('should clear the clock interval on destroy', () => {
    const clear = spyOn(window, 'clearInterval').and.callThrough();
    component.ngOnDestroy();
    expect(clear).toHaveBeenCalled();
  });

  it('should hide without Tauri global', async () => {
    await expectAsync(component.hide()).toBeResolved();
  });

  it('should hide via Tauri global when available', async () => {
    const hide = jasmine.createSpy('hide').and.returnValue(Promise.resolve());
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {
      window: { getCurrentWindow: () => ({ hide }) }
    };
    await component.hide();
    expect(hide).toHaveBeenCalled();
  });

  it('should swallow errors from the Tauri window API', async () => {
    const hide = jasmine.createSpy('hide').and.returnValue(Promise.reject(new Error('nope')));
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {
      window: { getCurrentWindow: () => ({ hide }) }
    };
    await expectAsync(component.hide()).toBeResolved();
    expect(hide).toHaveBeenCalled();
  });
});
