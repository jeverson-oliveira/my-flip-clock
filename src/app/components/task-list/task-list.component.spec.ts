import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../services/task.service';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let service: TaskService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TaskListComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TaskService);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add task', () => {
    component.newTitle = 'Nova';
    component.newSubject = 'Mat';
    component.add();
    expect(service.tasks.length).toBe(1);
    expect(component.newTitle).toBe('');
  });

  it('should toggle and remove', () => {
    service.add('T');
    const id = service.tasks[0].id;
    component.toggle(id);
    expect(service.tasks[0].done).toBeTrue();
    component.remove(id);
    expect(service.tasks.length).toBe(0);
  });

  it('should clear done', () => {
    service.add('A');
    service.toggle(service.tasks[0].id);
    component.clearDone();
    expect(service.tasks.length).toBe(0);
  });

  it('should switch filter', () => {
    component.filter = 'open';
    expect(component.filter).toBe('open');
    component.filter = 'done';
    expect(component.filter).toBe('done');
  });

  it('should render list', () => {
    service.add('Render');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.task-list')).toBeTruthy();
  });
});
