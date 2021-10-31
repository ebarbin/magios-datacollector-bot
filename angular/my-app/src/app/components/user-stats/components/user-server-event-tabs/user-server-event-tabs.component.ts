import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitServerDataAction } from 'src/app/actions/server-data.actions';
import { ServerDataState } from 'src/app/states/server-data.state';
import { UserStatsState } from 'src/app/states/user-stats.state';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Navigate } from '@ngxs/router-plugin';

@Component({
  selector: 'app-user-server-events',
  templateUrl: './user-server-event-tabs.component.html',
  styleUrls: ['./user-server-event-tabs.component.scss']
})
export class UserServerEventTabsComponent implements OnInit {

  faChevronLeft = faChevronLeft;

  @Select(ServerDataState.getServers) getServers$: Observable<any> | undefined;
  @Select(UserStatsState.getEvents) getEvents$: Observable<any>| undefined;

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch([new InitServerDataAction()]);
  }

  onBack() {
    this.store.dispatch(new Navigate(['user-stats']))
  }

}
