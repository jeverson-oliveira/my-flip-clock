import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  private taskService = inject(TaskService);
  tasks$ = this.taskService.tasks$;

  newTitle = '';
  newSubject = '';
  filter: 'all' | 'open' | 'done' = 'all';

  add(): void {
    this.taskService.add(this.newTitle, this.newSubject);
    this.newTitle = '';
  }

  toggle(id: string): void {
    this.taskService.toggle(id);
  }

  remove(id: string): void {
    this.taskService.remove(id);
  }

  clearDone(): void {
    this.taskService.clearDone();
  }
}
