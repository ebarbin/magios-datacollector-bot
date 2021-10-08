import { Component, Input, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import * as moment from 'moment';

@Component({
  selector: 'app-user-stats-table',
  templateUrl: './user-stats-table.component.html',
  styleUrls: ['./user-stats-table.component.scss']
})
export class UserStatsTableComponent implements OnInit {

  @Input() users: any;
  sortedUsers: any[] = [];
  
  constructor() {}

  ngOnInit(): void {
    moment();
    this.sortedUsers = this.users.slice();
  }

  sortData(sort: Sort) {
    const data = this.users.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedUsers = data;
      return;
    }

    this.sortedUsers = data.sort((a:any, b:any) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'username': return this.compare(a.username, b.username, isAsc);
        case 'roles': return this.compareRoles(a.roles, b.roles, isAsc);
        case 'joinDate': return this.compareDate(a.joinDate, b.joinDate, isAsc);
        case 'lastTextChannelName': return this.compare(a.lastTextChannelName, b.lastTextChannelName, isAsc);
        case 'lastTextChannelDate': return this.compareDate(a.lastTextChannelDate, b.lastTextChannelDate, isAsc);
        case 'msgChannelCount': return this.compare(a.msgChannelCount, b.msgChannelCount, isAsc);

        case 'lastServerId': return this.compare(a.lastServerId, b.lastServerId, isAsc);
        case 'lastServerAccess': return this.compareDate(a.lastServerAccess, b.lastServerAccess, isAsc);
        case 'joinVoiceChannelCount': return this.compare(a.joinVoiceChannelCount, b.joinVoiceChannelCount, isAsc);

        case 'lastVoiceChannelName': return this.compare(a.lastVoiceChannelName, b.lastVoiceChannelName, isAsc);
        case 'lastVoiceChannelAccessDate': return this.compare(a.lastVoiceChannelAccessDate, b.lastVoiceChannelAccessDate, isAsc);
        case 'joinVoiceChannelCount': return this.compare(a.joinVoiceChannelCount, b.joinVoiceChannelCount, isAsc);
        case 'voiceChannelTotalTime': return this.compare(a.voiceChannelTotalTime, b.voiceChannelTotalTime, isAsc);
        default: return 0;
      }
    });
  }

  private compareRoles(a: string[], b: string[], isAsc: boolean) {
    if ((a == null || a.length == 0) && (b == null || b.length == 0)) return 0;
    else if (a == null || a.length == 0) return -1 * (isAsc ? 1 : -1);
    else if (b == null || b.length == 0) return 1 * (isAsc ? 1 : -1);
    else return (a[0] < b[0] ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    if (a == null && b == null) return 0;
    else if (a == null) return -1 * (isAsc ? 1 : -1);
    else if (b == null) return 1 * (isAsc ? 1 : -1);
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private compareDate(a: moment.Moment, b: moment.Moment, isAsc: boolean) {
    if (a == null && b == null) return 0;
    else if (a == null) return -1 * (isAsc ? 1 : -1);
    else if (b == null) return 1 * (isAsc ? 1 : -1);
    else return (a.isBefore(b) ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
