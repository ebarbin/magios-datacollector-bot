import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitServerDataAction } from 'src/app/actions/server-data.actions';
import { ServerDataState } from 'src/app/states/server-data.state';

@Component({
  selector: 'app-server-data',
  templateUrl: './server-data.component.html',
  styleUrls: ['./server-data.component.scss']
})
export class ServerDataComponent implements OnInit {
  
  @Select(ServerDataState.getServers) getServers$: Observable<any> | undefined;
  @Select(ServerDataState.getTerrains) getTerrains$: Observable<any> | undefined;

  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch(new InitServerDataAction());
  }

}
