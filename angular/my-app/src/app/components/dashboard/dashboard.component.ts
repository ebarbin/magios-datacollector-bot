import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GetAllUsersAction } from 'src/app/actions/user-stats.action';
import { UserStatsState } from 'src/app/states/user-stats.state';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  @Select(UserStatsState.getUsers) getUsers$: Observable<any> | undefined;
  
  constructor(private store: Store) {}
  ngOnInit() {
    this.store.dispatch([new GetAllUsersAction()]);
  }
}
