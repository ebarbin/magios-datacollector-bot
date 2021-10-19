import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitDashboardAction } from 'src/app/actions/dashboard.actions';
import { DashboardState } from 'src/app/states/dashboard.state';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @Select(DashboardState.getUsers) getUsers$: Observable<any> | undefined;
  
  constructor(private store: Store) {}
  ngOnInit() {
    this.store.dispatch([new InitDashboardAction()]);
  }
}
