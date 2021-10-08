import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { finalize, tap, map } from "rxjs/operators";
import { GetAllUsersAction } from "../actions/user-stats.action";
import { UserStatsService } from "../services/user-stats.service";
import * as moment from 'moment';

export interface UserStatsStateModel {
    users: any,
  }
    
  const initialState: UserStatsStateModel = {
    users: null
  };
  
  const CORE_STATE_TOKEN = new StateToken<UserStatsStateModel>('userStats');
  
  @State<UserStatsStateModel>({
      name: CORE_STATE_TOKEN,
      defaults: initialState
    })
  @Injectable()
  export class UserStatsState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private store: Store, private userStatsService: UserStatsService) {}
        
    @Action(GetAllUsersAction)
    getAllUsersAction(ctx: StateContext<UserStatsStateModel>, action: GetAllUsersAction) {

      console.log(1);
        this.blockUI.start();

        return this.userStatsService.getAllUsers().pipe(
            map(response => {
              return response.users.map((u:any) => {
                u.joinDate = u.joinDate ? moment(u.joinDate, 'DD/MM/YYYY HH:mm:ss') : null
                u.lastTextChannelDate = u.lastTextChannelDate ? moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss') : null;
                u.lastVoiceChannelAccessDate = u.lastVoiceChannelAccessDate ? moment(u.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss') : null;
                u.lastServerAccess = u.lastServerAccess ? moment(u.lastServerAccess, 'DD/MM/YYYY HH:mm:ss') : null;
                return u;
              })
            }),
            tap(users => {
                ctx.patchState({users: users});
            }),
            finalize(() => this.blockUI.stop() )
        )
    }

    @Selector()
    static getUsers(state: UserStatsStateModel) {
      return state.users;
    }
    
  }