import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FocusSoundsComponent } from './focus-sounds.component';
import { FocusSoundsService } from '../../services/focus-sounds.service';

describe('FocusSoundsComponent', () => {
  let component: FocusSoundsComponent;
  let fixture: ComponentFixture<FocusSoundsComponent>;
  let service: FocusSoundsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FocusSoundsComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(FocusSoundsComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(FocusSoundsService);
    fixture.detectChanges();
  });

  afterEach(() => service.ngOnDestroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should play via service', () => {
    const spy = spyOn(service, 'play');
    component.play('white');
    expect(spy).toHaveBeenCalledWith('white');
  });

  it('should stop via service', () => {
    const spy = spyOn(service, 'stop');
    component.stop();
    expect(spy).toHaveBeenCalled();
  });

  it('should set volume', () => {
    const spy = spyOn(service, 'setVolume');
    component.onVolume('0.8');
    expect(spy).toHaveBeenCalledWith(0.8);
  });

  it('should expose currentId and volume', () => {
    expect(component.currentId).toBeNull();
    expect(component.volume).toBe(0.5);
  });

  it('should render sounds', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.sound-card').length).toBe(3);
  });
});
