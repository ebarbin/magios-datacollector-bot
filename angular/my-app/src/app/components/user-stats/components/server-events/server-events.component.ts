import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitServerDataAction } from 'src/app/actions/server-data.actions';
import { InitServerEventsAction, InitUserStatsAction } from 'src/app/actions/user-stats.action';
import { ServerDataState } from 'src/app/states/server-data.state';
import { UserStatsState } from 'src/app/states/user-stats.state';

@Component({
  selector: 'app-server-events',
  templateUrl: './server-events.component.html',
  styleUrls: ['./server-events.component.scss']
})
export class ServerEventsComponent implements OnInit {

  @Select(ServerDataState.getServers) getServers$: Observable<any> | undefined;
  @Select(UserStatsState.getEvents) getEvents$: Observable<any>| undefined;

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch([
      new InitServerEventsAction(),
      new InitServerDataAction()
    ]);
  }

}
