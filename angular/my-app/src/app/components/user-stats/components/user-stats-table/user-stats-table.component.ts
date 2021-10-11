import { Component, Input, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { Store } from '@ngxs/store';
import { ApplyChangeUserStatsAction, SortUserStatsAction } from 'src/app/actions/user-stats.action';

@Component({
  selector: 'app-user-stats-table',
  templateUrl: './user-stats-table.component.html',
  styleUrls: ['./user-stats-table.component.scss']
})
export class UserStatsTableComponent implements OnInit {

  fieldEditable = false;
  userIdSelected = '';
  fieldSelected = '';
  input:any;

  @Input() users: any;
  
  constructor(private store: Store) {}

  ngOnInit(): void {}

  onApplyChange(event: any, user: any) {
    console.log(this.input);
    user[this.fieldSelected] = this.input;
    
    this.fieldEditable = false;
    this.fieldSelected = '';
    this.userIdSelected = '';
    
    this.store.dispatch(new ApplyChangeUserStatsAction({user}));
  }

  onEditField(user:any, field: string) {
    this.userIdSelected = user.id;
    this.fieldSelected = field;
    this.fieldEditable = !this.fieldEditable;
    this.input = user[field];
  }

  onSortData(sort: Sort) {
    this.store.dispatch(new SortUserStatsAction({sort}));
  }
}
