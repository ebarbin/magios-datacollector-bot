import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { finalize, map, switchMap, tap } from "rxjs/operators";
import { ApplyChangeUserStatsAction, ApplyFilterUserStatsAction, ClearFiltersUserStatsAction, InitServerEventsAction, InitUserStatsAction, ShowUserServerEventTabsAction, SortUserStatsAction } from "../actions/user-stats.action";
import { UserStatsService } from "../services/user-stats.service";
import * as moment from 'moment';
import { patch, updateItem } from "@ngxs/store/operators";
import { includes } from 'lodash';
import { UserService } from "../services/user.service";
import { Navigate } from "@ngxs/router-plugin";
import { CoreState } from "./core.state";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { of } from "rxjs";

export interface UserStatsStateModel {
  userFilter: string,
  rolesFilter: string[],
  allUsers: any,
  users: any,
  user: any,
  events: any
}
    
const initialState: UserStatsStateModel = { 
  userFilter: '',
  rolesFilter: ['Magios', 'Admins', 'NewJoiner', 'Limbo', ''],
  allUsers: [],
  users: [],
  user: null,
  events: null
};
  
const CORE_STATE_TOKEN = new StateToken<UserStatsStateModel>('userStats');
  @State<UserStatsStateModel>({
      name: CORE_STATE_TOKEN,
      defaults: initialState
    })
  @Injectable()
  export class UserStatsState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private store: Store, private userStatsService: UserStatsService, private userService: UserService) {}
        
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
                  
                  case 'events': return this.compareEvents(a.events, b.events, isAsc);

                  default: return 0;
                }
              });
        }
        ctx.patchState({users: sortedData});
    }

    private compareEvents(a: string[], b: string[], isAsc: boolean) {
      if ((a == null || a.length == 0) && (b == null || b.length == 0)) return 0;
      else if (a == null || a.length == 0) return -1 * (isAsc ? 1 : -1);
      else if (b == null || b.length == 0) return 1 * (isAsc ? 1 : -1);
      else return 0;
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

    @Action(ApplyChangeUserStatsAction)
    applyChangeUserStatsAction(ctx: StateContext<UserStatsStateModel>, action: ApplyChangeUserStatsAction) {

      const myUser = this.store.selectSnapshot(CoreState.getUser);
      const { user } = action.payload;

      if (this.allowOperation(myUser)) {
        this.blockUI.start();
        return this.userStatsService.updateUser(user).pipe(
          tap(() => {
            ctx.setState(
              patch({ users: updateItem<any>(item => item.id === user.id, user) })
            );
          }),
          finalize(() => this.blockUI.stop() )
        )
      } else {
        return this.store.dispatch([ new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}) ]);
      }
    }

    @Action(InitServerEventsAction)
    initServerEventsAction(ctx: StateContext<UserStatsStateModel>) {
      return this.userService.getAllUsers().pipe(
        switchMap(users => {
          const events: any = [];
          users.forEach((user:any) => {
            user.events.forEach((e:any) => {
              e.user = user;
              events.push(e)
            });  
          });
          return of(events);
        }),
        tap(events => {
           ctx.patchState({ events })
        })
      )
    }

    @Action(InitUserStatsAction)
    initUserStatsAction(ctx: StateContext<UserStatsStateModel>) {
      return this.userService.getAllUsers().pipe(
        tap(users => {
          return ctx.patchState({ users: users, allUsers: users  })
        })
      )
    }

    @Action(ClearFiltersUserStatsAction)
    clearFiltersModulesAction(ctx: StateContext<UserStatsStateModel>) {
        const { allUsers } = ctx.getState();
        
        ctx.patchState({ 
            rolesFilter: ['Magios', 'Admins', 'NewJoiner', 'Limbo', ''], 
            users: allUsers,
            userFilter: ''
        });
    }

    @Action(ShowUserServerEventTabsAction)
    showUserServerEventTabsAction(ctx: StateContext<UserStatsStateModel>, action: ShowUserServerEventTabsAction) {
        
        const { user } =  action.payload;
        ctx.patchState( { events: user.events, user: user } );

        ctx.dispatch(new Navigate(['user-server-event-tabs']))
       
    }

    @Action(ApplyFilterUserStatsAction)
    applyFilterModulesAction(ctx: StateContext<UserStatsStateModel>, action: ApplyFilterUserStatsAction) {
        const { allUsers } = ctx.getState();
        const { userFilter, rolesFilter } =  action.payload;

        const results: any[] = [];
        let userFlag, roleFlag;
        
        allUsers.forEach((u:any) => {
            if (rolesFilter.length > 2) roleFlag = true;
            else if (u.roles.length > 1) roleFlag = includes(rolesFilter, 'Admins');
            else roleFlag = includes(rolesFilter, u.roles[0]);

            if (includes(rolesFilter, '') &&  u.roles.length == 0) roleFlag = true;
            
            userFlag = userFilter == '' || userFilter.toLowerCase() == u.username.toLowerCase()
            
            if (roleFlag && userFlag) results.push(u);
        });

        ctx.patchState({ users: results, userFilter: userFilter, rolesFilter: rolesFilter});
    }

    private allowOperation(myUser: any) {
      return myUser.roles.find((r:string)=> r == 'Admins');
    }

    @Selector()
    static getUsers(state: UserStatsStateModel) {
      return state.users;
    }

    @Selector()
    static getEvents(state: UserStatsStateModel) {
      return {events: state.events, user: state.user};
    }

    @Selector([UserStatsState.getUsers])
    static getAllUsernames(users:any) {
      return users.map((u:any) => u.username);
    }

    @Selector()
    static getSelectedFilters(state: UserStatsStateModel) {
      return { 
          userFilter: state.userFilter,
          rolesFilter: state.rolesFilter
        };
    }
  }