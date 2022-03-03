import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitTaskAction } from 'src/app/actions/task.actions';
import { TaskState } from 'src/app/states/task.state';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {

  @Select(TaskState.getTasks) getTasks$: Observable<any> | undefined;

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch(new InitTaskAction());
  }

}
