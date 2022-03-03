import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApplyFilterModulesAction, ClearFiltersModulesAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { ModuleState } from 'src/app/states/module.state';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent implements OnInit, OnDestroy {

  myControl = new FormControl();
  filteredOptions$: Observable<string[]> | undefined;

  @Select(CoreState.getRawSortedCountries) getCountries$: Observable<any> | undefined;
  @Select(ModuleState.getSelectedFilters) getSelectedFilters$: Observable<any> | undefined;
  subs: Subscription | undefined;

  statusFilter: string[] = [];
  rolesFilter: string[] = [];

  selectedCountries: string[] = [];
  selectedUser: string = '';
  
  constructor(private store: Store, private dialogRef: MatDialogRef<FilterDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {

    this.filteredOptions$ = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );

    this.subs = this.getSelectedFilters$?.subscribe(value => {
      this.selectedCountries = value.countriesFilter;
      this.selectedUser = value.userFilter;
      this.myControl.setValue(this.selectedUser);
      this.statusFilter = value.statusFilter;
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

  onCountriesFilterChange(values: string[]) {
    this.selectedCountries = values;
  }

  onUsersFilterChange(event: any) {
    this.selectedUser = event.option.value;
  }

  onRolesFilterChange(values: string[]) {
    this.rolesFilter = values;
  }

  onAccept() {
    this.store.dispatch(new ApplyFilterModulesAction({
      countriesFilter: this.selectedCountries, 
      statusFilter: this.statusFilter, 
      userFilter: this.selectedUser == this.myControl.value ? this.selectedUser : '',
      rolesFilter: this.rolesFilter
    }));
    this.dialogRef.close();
  }

  onClear() {
    this.store.dispatch(new ClearFiltersModulesAction());
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}