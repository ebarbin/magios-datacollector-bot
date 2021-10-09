import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { finalize, tap, map } from "rxjs/operators";
import { GetAllUsersAction, SortUserStatsAction } from "../actions/user-stats.action";
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
        
    @Action(SortUserStatsAction)
    sortUserStatsAction(ctx: StateContext<UserStatsStateModel>, action: SortUserStatsAction) {
        const {sort}  = action.payload;
        const {users} = ctx.getState()
        const data = users.slice();
        let sortedData;
        if (!sort.active || sort.direction === '') {
            sortedData = data; 
        } else {
            sortedData = data.sort((a:any, b:any) => {
                const isAsc = sort.direction === 'asc';
                switch (sort.active) {
                  case 'username': return this.compare(a.username, b.username, isAsc);
                  case 'roles': return this.compareRoles(a.roles, b.roles, isAsc);
                  case 'joinDate': return this.compareDate(a.joinDate, b.joinDate, isAsc);
                  case 'lastTextChannelName': return this.compare(a.lastTextChannelName, b.lastTextChannelName, isAsc);
                  case 'lastTextChannelDate': return this.compareDate(a.lastTextChannelDate, b.lastTextChannelDate, isAsc);
                  case 'msgChannelCount': return this.compare(a.msgChannelCount, b.msgChannelCount, isAsc);
          
                  case 'lastServerId': return this.compare(a.lastServerId, b.lastServerId, isAsc);
                  case 'lastServerAccess': return this.compareDate(a.lastServerAccess, b.lastServerAccess, isAsc);
                  case 'joinVoiceChannelCount': return this.compare(a.joinVoiceChannelCount, b.joinVoiceChannelCount, isAsc);
          
                  case 'lastVoiceChannelName': return this.compare(a.lastVoiceChannelName, b.lastVoiceChannelName, isAsc);
                  case 'lastVoiceChannelAccessDate': return this.compare(a.lastVoiceChannelAccessDate, b.lastVoiceChannelAccessDate, isAsc);
                  case 'joinVoiceChannelCount': return this.compare(a.joinVoiceChannelCount, b.joinVoiceChannelCount, isAsc);
                  case 'voiceChannelTotalTime': return this.compare(a.voiceChannelTotalTime, b.voiceChannelTotalTime, isAsc);
                  default: return 0;
                }
              });
        }
        ctx.patchState({users: sortedData});
    }

    private compareRoles(a: string[], b: string[], isAsc: boolean) {
      if ((a == null || a.length == 0) && (b == null || b.length == 0)) return 0;
      else if (a == null || a.length == 0) return -1 * (isAsc ? 1 : -1);
      else if (b == null || b.length == 0) return 1 * (isAsc ? 1 : -1);
      else return (a[0] < b[0] ? -1 : 1) * (isAsc ? 1 : -1);
    }
  
    private compare(a: number | string, b: number | string, isAsc: boolean) {
      if (a == null && b == null) return 0;
      else if (a == null) return -1 * (isAsc ? 1 : -1);
      else if (b == null) return 1 * (isAsc ? 1 : -1);
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }
  
    private compareDate(a: moment.Moment, b: moment.Moment, isAsc: boolean) {
      if (a == null && b == null) return 0;
      else if (a == null) return -1 * (isAsc ? 1 : -1);
      else if (b == null) return 1 * (isAsc ? 1 : -1);
      else return (a.isBefore(b) ? -1 : 1) * (isAsc ? 1 : -1);
    }

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