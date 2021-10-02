import { Component, Input, OnInit } from '@angular/core';
import { Select, Selector, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-module-table',
  templateUrl: './module-table.component.html',
  styleUrls: ['./module-table.component.scss']
})
export class ModuleTableComponent implements OnInit {

  faFilter = faFilter;
  @Select(CoreState.getCountries) getCountries$: Observable<any> | undefined;

  @Input() modules: any;
  @Input() users: any;

  constructor(private store: Store) { }

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
}
