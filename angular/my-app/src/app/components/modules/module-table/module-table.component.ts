import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { ShowHideDialogComponent } from '../show-hide-dialog/show-hide-dialog.component';
import { includes } from 'lodash';

@Component({
  selector: 'app-module-table',
  templateUrl: './module-table.component.html',
  styleUrls: ['./module-table.component.scss']
})
export class ModuleTableComponent implements OnInit {

  faEyeSlash = faEyeSlash;
  faFilter = faFilter;

  
  @Select(CoreState.getCountries) getCountries$: Observable<any> | undefined;

  @Input() modules: any;
  @Input() users: any;

  constructor(private store: Store, public dialog: MatDialog) { }

  ngOnInit(): void {}

  onToggleValue(user:any, field: string) {
    this.store.dispatch(new ToggleModuleValueAction({user, field}))
  }

  onToogleStatus(user:any){
    this.store.dispatch(new ToggleUserStatusValueAction({user}))
  }

  isAdmin(roles: string[]) {
    return includes(roles, 'Admins');
  }

  isMagio(roles: string[]) {
    return includes(roles, 'Magios') && !includes(roles, 'Admins');
  }

  isNewJoiner(roles: string[]) {
    return includes(roles, 'NewJoiner');
  }

  onChangeCountry(country:any, user:any) {
    this.store.dispatch(new UpdateCountryUserValueAction({user, country}));
  }

  onFilter() {
    this.dialog.open(FilterDialogComponent);
  }

  onShowHide() {
    this.dialog.open(ShowHideDialogComponent);
  }
}
