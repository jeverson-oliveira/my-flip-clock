import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FlipClockComponent } from './flip-clock.component';

describe('FlipClockComponent', () => {
  let component: FlipClockComponent;
  let fixture: ComponentFixture<FlipClockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlipClockComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(FlipClockComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should update hours/minutes/seconds from date', () => {
    fixture.detectChanges();
    const date = new Date(2026, 0, 1, 12, 34, 56);
    (component as unknown as { updateFromDate: (d: Date) => void }).updateFromDate(date);
    expect(component.hoursTens).toBe(1);
    expect(component.hoursUnits).toBe(2);
    expect(component.minutesTens).toBe(3);
    expect(component.minutesUnits).toBe(4);
    expect(component.secondsTens).toBe(5);
    expect(component.secondsUnits).toBe(6);
  });

  it('should handle midnight correctly', () => {
    fixture.detectChanges();
    const date = new Date(2026, 0, 1, 0, 0, 0);
    (component as unknown as { updateFromDate: (d: Date) => void }).updateFromDate(date);
    expect(component.hoursTens).toBe(0);
    expect(component.hoursUnits).toBe(0);
  });

  it('should update every second', fakeAsync(() => {
    fixture.detectChanges();
    const spy = spyOn(component as unknown as { updateFromDate: (d: Date) => void }, 'updateFromDate');
    tick(1000);
    expect(spy).toHaveBeenCalled();
    tick(2000);
    expect(spy.calls.count()).toBeGreaterThan(1);
  }));

  it('should clear interval on destroy', () => {
    fixture.detectChanges();
    const clearSpy = spyOn(window as unknown as { clearInterval: (id: number) => void }, 'clearInterval');
    fixture.destroy();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('should render flip cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.flip-unit').length).toBe(6);
    expect(compiled.querySelector('.clock-container')).toBeTruthy();
  });
});
