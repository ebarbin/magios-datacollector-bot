import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApplyFilterUserStatsAction, ClearFiltersUserStatsAction, ClearFilterSelection } from 'src/app/actions/user-stats.action';
import { UserStatsState } from 'src/app/states/user-stats.state';

@Component({
  selector: 'app-filter-user-stats-dialog',
  templateUrl: './filter-user-stats-dialog.component.html',
  styleUrls: ['./filter-user-stats-dialog.component.scss']
})
export class FilterUserStatsDialogComponent implements OnInit {

  myControl = new FormControl();
  filteredOptions$: Observable<string[]> | undefined;

  @Select(UserStatsState.getSelectedFilters) getSelectedFilters$: Observable<any> | undefined;
  subs: Subscription | undefined;

  statusFilter: string[] = [];
  rolesFilter: string[] = [];

  selectedCountries: string[] = [];
  selectedUser: string = '';
  
  constructor(private store: Store, private dialogRef: MatDialogRef<FilterUserStatsDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {

    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    this.subs = this.getSelectedFilters$?.subscribe(value => {
      this.selectedUser = value.userFilter;
      this.myControl.setValue(this.selectedUser);
      this.rolesFilter = value.rolesFilter;
    });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.filter((u: string) => u.toLowerCase().includes(filterValue));
  }
  
  onStatusFilterChange(values: string[]) {
    this.statusFilter = values;
  }

  onUsersFilterChange(event: any) {
    this.selectedUser = event.option.value;
  }

  onRolesFilterChange(values: string[]) {
    this.rolesFilter = values;
  }

  onAccept() {
    this.store.dispatch(new ApplyFilterUserStatsAction({
      userFilter: this.selectedUser == this.myControl.value ? this.selectedUser : '',
      rolesFilter: this.rolesFilter
    }));
    this.dialogRef.close();
  }

  onClear() {
    this.store.dispatch(new ClearFiltersUserStatsAction());
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }

  onClearField(filter: string) {
    this.store.dispatch(new ClearFilterSelection({filter: filter}));
  }
}
