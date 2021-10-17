import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { finalize, map, tap } from "rxjs/operators";
import { InitDashboardAction } from "../actions/dashboard-actions";
import * as moment from 'moment';
import { UserService } from "../services/user.service";

export interface DashboardStateModel {
    users: any 
}
      
const initialState: DashboardStateModel = { 
    users: null
};

const CORE_STATE_TOKEN = new StateToken<DashboardStateModel>('dashboard');
  @State<DashboardStateModel>({
      name: CORE_STATE_TOKEN,
      defaults: initialState
    })
  @Injectable()
  export class DashboardState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private userService: UserService) {}

    @Action(InitDashboardAction)
    initDashboardAction(ctx: StateContext<DashboardStateModel>) {
      return this.userService.getAllUsers().pipe(
        tap(users => {
          return ctx.patchState({ users: users })
        })
      )
    }

    @Selector()
    static getUsers(state: DashboardStateModel) {
      return state.users;
    }
  }