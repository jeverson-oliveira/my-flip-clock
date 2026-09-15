import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Sound {
  id: string;
  label: string;
  emoji: string;
  src: string;
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
    { id: 'white', label: 'Ruído Branco', emoji: '🌫️', src: 'https://cdn.pixabay.com/audio/2022/03/24/audio_8f9bd4170e.mp3' },
    { id: 'rain', label: 'Chuva', emoji: '🌧️', src: 'https://cdn.pixabay.com/audio/2021/08/04/audio_a14a8f3302.mp3' },
    { id: 'lofi', label: 'Lo-fi', emoji: '🎧', src: 'https://cdn.pixabay.com/audio/2022/10/30/audio_8ef11c7db3.mp3' }
  ];

  currentId: string | null = null;
  volume = 0.5;
  private audio: HTMLAudioElement | null = null;

  play(id: string): void {
    if (this.currentId === id) {
      this.stop();
      return;
    }
    this.stop();
    const s = this.sounds.find(x => x.id === id)!;
    this.audio = new Audio(s.src);
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.play().catch(() => { /* autoplay bloqueado */ });
    this.currentId = id;
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.currentId = null;
  }

  onVolume(v: string): void {
    this.volume = parseFloat(v);
    if (this.audio) this.audio.volume = this.volume;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
