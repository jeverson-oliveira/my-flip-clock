import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add task', () => {
    service.add('Estudar Angular');
    expect(service.tasks.length).toBe(1);
    expect(service.tasks[0].title).toBe('Estudar Angular');
    expect(service.tasks[0].done).toBeFalse();
  });

  it('should trim title and ignore empty', () => {
    service.add('   ');
    expect(service.tasks.length).toBe(0);
    service.add('  Tarefa  ', '  Matemática  ');
    expect(service.tasks[0].title).toBe('Tarefa');
    expect(service.tasks[0].subject).toBe('Matemática');
  });

  it('should toggle task', () => {
    service.add('Tarefa');
    const id = service.tasks[0].id;
    service.toggle(id);
    expect(service.tasks[0].done).toBeTrue();
    expect(service.tasks[0].completedAt).toBeDefined();
    service.toggle(id);
    expect(service.tasks[0].done).toBeFalse();
  });

  it('should remove task', () => {
    service.add('A');
    service.add('B');
    const id = service.tasks[0].id;
    service.remove(id);
    expect(service.tasks.length).toBe(1);
  });

  it('should clear done tasks', () => {
    service.add('A');
    service.add('B');
    service.toggle(service.tasks[0].id);
    service.clearDone();
    expect(service.tasks.length).toBe(1);
    expect(service.tasks[0].done).toBeFalse();
  });

  it('should persist to localStorage', () => {
    service.add('Persist');
    const raw = localStorage.getItem('flipclock_tasks');
    expect(raw).toContain('Persist');
    const service2 = new TaskService();
    expect(service2.tasks.length).toBe(1);
  });

  it('should handle corrupted localStorage', () => {
    localStorage.setItem('flipclock_tasks', 'invalid json');
    const svc = new TaskService();
    expect(svc.tasks.length).toBe(0);
  });

  it('should emit via tasks$', (done) => {
    service.tasks$.subscribe(tasks => {
      if (tasks.length === 1) {
        expect(tasks[0].title).toBe('Emit');
        done();
      }
    });
    service.add('Emit');
  });
});
