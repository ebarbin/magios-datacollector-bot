import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { InitModulesAction } from 'src/app/actions/module.action';
import { CoreState } from 'src/app/states/core.state';
import { ModuleState } from 'src/app/states/module.state';

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss']
})
export class ModulesComponent implements OnInit {

  @Select(ModuleState.getModules) getModules$: Observable<any> | undefined;
  @Select(ModuleState.getUsersModules) getUsersModules$: Observable<any> | undefined;
  
  constructor(private store: Store) { }

  ngOnInit(): void {
    this.store.dispatch(new InitModulesAction());
  }

}
