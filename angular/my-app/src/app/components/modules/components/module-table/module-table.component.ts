import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { RegisterUserAction, SortUsersModuleAction, ToggleModuleValueAction, ToggleUserStatusValueAction, ToggleLockStatusAction,
  UpdateCountryUserValueAction, FilterByUserModulesAction, ClearFiltersModulesAction } from 'src/app/actions/module.action';
import { faFilter, faCheck, faUser, faEraser, faEyeSlash, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { ShowHideDialogComponent } from '../show-hide-dialog/show-hide-dialog.component';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'app-module-table',
  templateUrl: './module-table.component.html',
  styleUrls: ['./module-table.component.scss']
})
export class ModuleTableComponent implements OnInit {

  faCheck = faCheck;
  faEyeSlash = faEyeSlash;
  faFilter = faFilter;
  faUser = faUser;
  faEraser = faEraser;
  faLock = faLock;
  faUnlock = faUnlock;

  @Input() isLock: any;
  @Input() modules: any;
  @Input() countries: any;
  @Input() users: any;
  @Input() allUsernames: any;
  @Input() isNewUser: any;
  @Input() isAdmin: any;

  constructor(private store: Store, private dialog: MatDialog) { }

  ngOnInit(): void {}

  onToggleValue(user:any, field: string) {
    if (this.isLock) return;
    this.store.dispatch(new ToggleModuleValueAction({user, field}))
  }

  onToogleStatus(user:any){
    if (this.isLock) return;
    this.store.dispatch(new ToggleUserStatusValueAction({user}))
  }

  onChangeCountry(country:any, user:any) {
    if (this.isLock) return;
    this.store.dispatch(new UpdateCountryUserValueAction({user, country}));
  }

  onFilter() {
    this.dialog.open(FilterDialogComponent, {data: this.allUsernames});
  }

  onFilterByUser(){
    this.store.dispatch(new FilterByUserModulesAction());
  }

  onClearFilters() {
    this.store.dispatch(new ClearFiltersModulesAction())
  }

  onShowHide() {
    this.dialog.open(ShowHideDialogComponent);
  }

  onSortData(sort: Sort) {
    this.store.dispatch(new SortUsersModuleAction({sort}));
  }
  
  onRegister() {
    this.store.dispatch(new RegisterUserAction());
  }

  onToggleLock() {
    this.store.dispatch(new ToggleLockStatusAction());
  }
}
