import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SoundId = 'white' | 'rain' | 'brown' | null;

@Injectable({ providedIn: 'root' })
export class FocusSoundsService implements OnDestroy {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;

  private currentSubject = new BehaviorSubject<SoundId>(null);
  current$ = this.currentSubject.asObservable();

  private volumeSubject = new BehaviorSubject<number>(0.5);
  volume$ = this.volumeSubject.asObservable();

  get currentId(): SoundId {
    return this.currentSubject.value;
  }

  get volume(): number {
    return this.volumeSubject.value;
  }

  play(id: Exclude<SoundId, null>): void {
    if (this.currentId === id) {
      this.stop();
      return;
    }
    this.stop();
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* resume bloqueado */ });

    const buffer = this.createBuffer(ctx, id);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = this.volume;

    if (id === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      this.filter = filter;
    } else {
      source.connect(gain);
      gain.connect(ctx.destination);
    }

    source.start();
    this.source = source;
    this.gainNode = gain;
    this.currentSubject.next(id);
  }

  stop(): void {
    if (this.source) {
      try { this.source.stop(); } catch { /* already stopped */ }
      try { this.source.disconnect(); } catch { /* ignore */ }
      this.source = null;
    }
    if (this.filter) {
      try { this.filter.disconnect(); } catch { /* ignore */ }
      this.filter = null;
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch { /* ignore */ }
      this.gainNode = null;
    }
    this.currentSubject.next(null);
  }

  setVolume(v: number): void {
    this.volumeSubject.next(v);
    if (this.gainNode) this.gainNode.gain.value = v;
  }

  ngOnDestroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close().catch(() => { /* close falhou */ });
      this.ctx = null;
    }
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.ctx;
  }

  private createBuffer(ctx: AudioContext, type: Exclude<SoundId, null>): AudioBuffer {
    const duration = 2;
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white' || type === 'rain') {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buffer;
  }
}
