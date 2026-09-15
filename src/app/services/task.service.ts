import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Task {
  id: string;
  title: string;
  subject?: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
}

const STORAGE_KEY = 'flipclock_tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>(this.load());
  tasks$ = this.tasksSubject.asObservable();

  get tasks(): Task[] {
    return this.tasksSubject.value;
  }

  add(title: string, subject?: string): void {
    const t = title.trim();
    if (!t) return;
    const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11);
    const task: Task = {
      id: uid,
      title: t,
      subject: subject?.trim() || undefined,
      done: false,
      createdAt: Date.now()
    };
    this.next([task, ...this.tasks]);
  }

  toggle(id: string): void {
    this.next(this.tasks.map(t =>
      t.id === id
        ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
        : t
    ));
  }

  remove(id: string): void {
    this.next(this.tasks.filter(t => t.id !== id));
  }

  clearDone(): void {
    this.next(this.tasks.filter(t => !t.done));
  }

  private next(tasks: Task[]): void {
    this.tasksSubject.next(tasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  private load(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Task[] : [];
    } catch {
      return [];
    }
  }
}
