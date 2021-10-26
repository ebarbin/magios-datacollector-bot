import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import { groupBy, orderBy } from 'lodash';
import { Store } from '@ngxs/store';
import { Navigate } from '@ngxs/router-plugin';


@Component({
  selector: 'app-user-events-server',
  templateUrl: './user-events-server.component.html',
  styleUrls: ['./user-events-server.component.scss']
})
export class UserEventsServerComponent implements OnInit {

  @Input() server: any;
  @Input() user: any;

  groupEvents: any = [];

  constructor(private store:Store) { }

  ngOnInit(): void {

    if (this.user) {
      let events = this.user.events.filter((e:any) => e.serverId == this.server.id);
      events = events.map((e:any) => {
        return { type: e.type, weapon: e.weapon, target: e.target, date: moment(e.date, 'YYYY-MM-DD HH:mm:ss.SSS'), key: moment(e.date, 'YYYY-MM-DD HH:mm:ss.SSS').format('DDMMYYYY') };
      });
      let aux = groupBy(events, 'key');
      let aux2 = [];
      for (let prop in aux) {
        aux2.push({dateStr: prop, date: moment(prop, 'DDMMYYYY'), events: aux[prop]});
      }
      this.groupEvents = orderBy(aux2, [(e => e.date.toDate() )], ['desc']);
    } else {
      this.store.dispatch(new Navigate(['user-stats']));
    }

  }

}