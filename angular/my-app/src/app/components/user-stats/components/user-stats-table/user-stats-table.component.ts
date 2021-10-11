import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { Store } from '@ngxs/store';
import { SortUserStatsAction } from 'src/app/actions/user-stats.action';
import { ValueChangeDialogComponent } from '../value-change-dialog/value-change-dialog.component';

@Component({
  selector: 'app-user-stats-table',
  templateUrl: './user-stats-table.component.html',
  styleUrls: ['./user-stats-table.component.scss']
})
export class UserStatsTableComponent implements OnInit {

  @Input() users: any;
  
  constructor(private store: Store, private dialog: MatDialog) {}

  ngOnInit(): void {}

  onEditField(user:any, field: string, label: string) {
    let fieldType = 'text';
    if (field == 'joinDate' || field == 'lastTextChannelDate' || field == 'lastVoiceChannelAccessDate' || field == 'lastServerAccess') fieldType = 'date';
    else if (field == 'msgChannelCount' || field == 'lastServerId' || field == 'joinVoiceChannelCount' || field == 'voiceChannelTotalTime') fieldType = 'number'
    this.dialog.open(ValueChangeDialogComponent, {data: {user: {...user}, field: field, value: user[field], fieldType: fieldType, label: label} });
  }

  onSortData(sort: Sort) {
    this.store.dispatch(new SortUserStatsAction({sort}));
  }
}
