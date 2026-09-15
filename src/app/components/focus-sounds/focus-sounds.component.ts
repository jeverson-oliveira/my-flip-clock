import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sound {
  id: string;
  label: string;
  emoji: string;
  type: 'white' | 'rain' | 'brown';
}

@Component({
  selector: 'app-focus-sounds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './focus-sounds.component.html',
  styleUrls: ['./focus-sounds.component.css']
})
export class FocusSoundsComponent implements OnDestroy {
  sounds: Sound[] = [
    { id: 'white', label: 'Ruído Branco', emoji: '🌫️', type: 'white' },
    { id: 'rain', label: 'Chuva', emoji: '🌧️', type: 'rain' },
    { id: 'lofi', label: 'Brown Noise', emoji: '🎧', type: 'brown' }
  ];

  currentId: string | null = null;
  volume = 0.5;

  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;

  play(id: string): void {
    if (this.currentId === id) {
      this.stop();
      return;
    }
    this.stop();

    const sound = this.sounds.find(s => s.id === id)!;
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* resume bloqueado */ });

    const buffer = this.createBuffer(ctx, sound.type);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = this.volume;

    if (sound.type === 'rain') {
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
    this.currentId = id;
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
    this.currentId = null;
  }

  onVolume(v: string): void {
    this.volume = parseFloat(v);
    if (this.gainNode) this.gainNode.gain.value = this.volume;
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

  private createBuffer(ctx: AudioContext, type: Sound['type']): AudioBuffer {
    const duration = 2; // segundos em loop
    const length = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'rain') {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else {
      // brown noise
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
