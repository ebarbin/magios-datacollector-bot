import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RegisterUserAction, SortUsersModuleAction, ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { faFilter, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons';
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
  
  @Select(CoreState.getCountries) getCountries$: Observable<any> | undefined;

  @Input() modules: any;
  @Input() users: any;
  @Input() allUsernames :string[] | undefined;
  @Input() isNewUser: boolean | false = false;
  

  constructor(private store: Store, private dialog: MatDialog) { }

  ngOnInit(): void {}

  onToggleValue(user:any, field: string) {
    this.store.dispatch(new ToggleModuleValueAction({user, field}))
  }

  onToogleStatus(user:any){
    this.store.dispatch(new ToggleUserStatusValueAction({user}))
  }

  onChangeCountry(country:any, user:any) {
    this.store.dispatch(new UpdateCountryUserValueAction({user, country}));
  }

  onFilter() {
    this.dialog.open(FilterDialogComponent, {data: this.allUsernames});
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
}
