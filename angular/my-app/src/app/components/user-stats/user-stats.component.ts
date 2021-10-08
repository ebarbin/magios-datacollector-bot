import {Component, OnInit} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GetAllUsersAction } from 'src/app/actions/user-stats.action';
import { UserStatsState } from 'src/app/states/user-stats.state';

@Component({
  selector: 'app-user-stats',
  templateUrl: './user-stats.component.html',
  styleUrls: ['./user-stats.component.scss']
})
export class UserStatsComponent implements OnInit {

  @Select(UserStatsState.getUsers) getUsers$: Observable<any> | undefined;

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch(new GetAllUsersAction());
  }
}