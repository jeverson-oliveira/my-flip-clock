import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusSoundsService } from '../../services/focus-sounds.service';

@Component({
  selector: 'app-focus-sounds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './focus-sounds.component.html',
  styleUrls: ['./focus-sounds.component.css']
})
export class FocusSoundsComponent {
  private soundsService = inject(FocusSoundsService);

  sounds = [
    { id: 'white' as const, label: 'Ruído Branco', emoji: '🌫️' },
    { id: 'rain' as const, label: 'Chuva', emoji: '🌧️' },
    { id: 'brown' as const, label: 'Brown Noise', emoji: '🎧' }
  ];

  get currentId() {
    return this.soundsService.currentId;
  }

  get volume() {
    return this.soundsService.volume;
  }

  play(id: 'white' | 'rain' | 'brown'): void {
    this.soundsService.play(id);
  }

  stop(): void {
    this.soundsService.stop();
  }

  onVolume(v: string): void {
    this.soundsService.setVolume(parseFloat(v));
  }
}
