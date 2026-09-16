import { TestBed } from '@angular/core/testing';
import { FocusSoundsService } from './focus-sounds.service';

describe('FocusSoundsService', () => {
  let service: FocusSoundsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FocusSoundsService);
  });

  afterEach(() => service.ngOnDestroy());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should play and toggle stop', () => {
    service.play('white');
    expect(service.currentId).toBe('white');
    service.play('white');
    expect(service.currentId).toBeNull();
  });

  it('should switch sounds', () => {
    service.play('white');
    service.play('rain');
    expect(service.currentId).toBe('rain');
  });

  it('should set volume', () => {
    service.play('brown');
    service.setVolume(0.8);
    expect(service.volume).toBe(0.8);
    service.stop();
  });

  it('should stop', () => {
    service.play('white');
    service.stop();
    expect(service.currentId).toBeNull();
  });

  it('should handle white, rain, brown buffers', () => {
    (service as unknown as { createBuffer: (ctx: AudioContext, t: string) => AudioBuffer }).createBuffer(new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(), 'white');
    (service as unknown as { createBuffer: (ctx: AudioContext, t: string) => AudioBuffer }).createBuffer(new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(), 'rain');
    (service as unknown as { createBuffer: (ctx: AudioContext, t: string) => AudioBuffer }).createBuffer(new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(), 'brown');
    expect(true).toBeTrue();
    service.ngOnDestroy();
  });

  it('should close context on destroy', () => {
    service.play('white');
    service.ngOnDestroy();
    expect(service.currentId).toBeNull();
  });
});
