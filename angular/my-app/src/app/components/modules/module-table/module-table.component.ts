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
import { Sort } from '@angular/material/sort';


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
  @Input() allUsernames :string[] | undefined
  sortedUsers: any[] = [];
  constructor(private store: Store, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.sortedUsers = this.users.slice();
  }

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
        case 'username-bis': return this.compare(a.username, b.username, isAsc);
        case 'roles': return this.compareRoles(a.roles, b.roles, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: number | string, b: number | string, isAsc: boolean) {
    if (a == null && b == null) return 0;
    else if (a == null) return -1 * (isAsc ? 1 : -1);
    else if (b == null) return 1 * (isAsc ? 1 : -1);
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  private compareRoles(a: string[], b: string[], isAsc: boolean) {
    if ((a == null || a.length == 0) && (b == null || b.length == 0)) return 0;
    else if (a == null || a.length == 0) return -1 * (isAsc ? 1 : -1);
    else if (b == null || b.length == 0) return 1 * (isAsc ? 1 : -1);
    else return (a[0] < b[0] ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
