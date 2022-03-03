import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { RunTaskNowAction, ToggleTaskStatusAction } from 'src/app/actions/task.actions';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.scss']
})
export class TaskItemComponent implements OnInit {

  @Input() task: any;

  constructor(private store: Store) { }

  ngOnInit(): void {
  }

  onToggleStatus(){
    this.store.dispatch(new ToggleTaskStatusAction({ values: this.task }))
  }

  onRunNow() {
    this.store.dispatch(new RunTaskNowAction({ values: this.task }))
  }

}
