import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { ApplyFilterModulesAction, ClearFiltersModulesAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { ModuleState } from 'src/app/states/module.state';
@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent implements OnInit, OnDestroy {

  @Select(CoreState.getCountries) getCountries$: Observable<any> | undefined;
  @Select(ModuleState.getSelectedFilters) getSelectedFilters$: Observable<any> | undefined;
  subs: Subscription | undefined;

  activeFilter = 'ALL';
  selectedCountries: string[] = [];

  constructor(private store: Store, private dialogRef: MatDialogRef<FilterDialogComponent>) {}

  ngOnInit(): void {
    this.subs = this.getSelectedFilters$?.subscribe(value => {
      this.selectedCountries = value.countriesFilter;
      this.activeFilter = value.statusFilter;
    });
  }

  onStatusFilterChange(value: string) {
    this.activeFilter = value;
  }

  onCountriesFilterChange(values: string[]) {
    this.selectedCountries = values;
  }

  onAccept() {
    this.store.dispatch(new ApplyFilterModulesAction({countriesFilter: this.selectedCountries, statusFilter: this.activeFilter}));
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
