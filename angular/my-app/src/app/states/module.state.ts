import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { catchError, finalize, switchMap, tap } from "rxjs/operators";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { ModulesService } from "../services/modules.service";
import { CoreState } from "./core.state";
import { ApplyFilterModulesAction, ClearFiltersModulesAction, InitModulesAction, RefreshElementModulesAction, ShowHideModulesAction, ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from "../actions/module.action";
import { includes } from 'lodash';
import { patch, updateItem } from '@ngxs/store/operators';
import { throwError } from "rxjs";

export interface ModuleStateModel {
    usersFilter: string[] | null,
    rolesFilter: string[] | null,
    statusFilter: string[] | null,
    countriesFilter: string[],
    modules: any,
    usersModules: any[],
    userModulesAll: any[]
}
  
const initialState: ModuleStateModel = {
    usersFilter: [],
    rolesFilter: ['Magios', 'Admins', 'NewJoiner'],
    statusFilter: ['ACTIVE', 'INACTIVE'],
    countriesFilter: [],
    modules: {},
    usersModules: [],
    userModulesAll: []
};

const CORE_STATE_TOKEN = new StateToken<ModuleStateModel>('module');

@State<ModuleStateModel>({
    name: CORE_STATE_TOKEN,
    defaults: initialState
  })
@Injectable()
export class ModuleState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(
        private store: Store,
        private modulesService: ModulesService) {}
        
    @Action(ToggleUserStatusValueAction)
    toggleUserStatusValueAction(ctx: StateContext<ModuleStateModel>, action: ToggleUserStatusValueAction) {

        const myUser = this.store.selectSnapshot(CoreState.getUser);
        const { user } = action.payload;

        if (this.allowOperation(myUser, user)) {
            
            const clone = {...user};
            clone.status = !user.status;

            return this.modulesService.updateUserStatus(user.id).pipe(
                switchMap(() => ctx.dispatch(new RefreshElementModulesAction({user: clone, update: true}))),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'User status update', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new RefreshElementModulesAction({user: user, update: false})
            ]);
        }

    }

    private allowOperation(myUser: any, user: any) {
        return myUser.roles.find((r:string)=> r == 'Admins') || myUser.id == user;
    }

    @Action(UpdateCountryUserValueAction)
    updateCountryUserValueAction(ctx: StateContext<ModuleStateModel>, action: UpdateCountryUserValueAction) {

        const myUser = this.store.selectSnapshot(CoreState.getUser);
        const { user, country } = action.payload;

        if (this.allowOperation(myUser, user)) {
            
            this.blockUI.start();

            const clone = {...user};
            clone.country = country;

            return this.modulesService.updateUserCountry(user.id, country).pipe(
                switchMap(() => ctx.dispatch(new RefreshElementModulesAction({user: clone, update: true}))),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'User country update', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new RefreshElementModulesAction({user: user, update: false})
            ]);
        }
    }

    @Action(ShowHideModulesAction)
    showHideModulesAction(ctx: StateContext<ModuleStateModel>, action: ShowHideModulesAction) {
        const { categories } = action.payload;
        const updatedModules = {
            terrains: categories[0].values.map((v:any) => { return {id: v.id, name: v.name, visible: v.completed} }),
            jets: categories[1].values.map((v:any) => { return {id: v.id, name: v.name, visible: v.completed} }),
            warbirds:categories[2].values.map((v:any) => { return {id: v.id, name: v.name, visible: v.completed} }),
            helis: categories[3].values.map((v:any) => { return {id: v.id, name: v.name, visible: v.completed} }),
            others:categories[4].values.map((v:any) => { return {id: v.id, name: v.name, visible: v.completed} })
        }
        ctx.patchState({modules: updatedModules})
    }

    @Action(RefreshElementModulesAction)
    refreshElementModulesAction(ctx: StateContext<ModuleStateModel>, action: RefreshElementModulesAction) {

        const { update } = action.payload;
        const { user } = action.payload;
                
        if (update) {
            return ctx.setState(
                patch({
                    usersModules: updateItem<any>(item => item.id === user.id, user)
                })
              );
        } else {
            return ctx.setState(
                patch({
                    usersModules: updateItem<any>(item => item.id === user.id, patch({ refresh: new Date().getTime()}))
                })
              );
        }
    }
        
    @Action(ToggleModuleValueAction)
    toggleModuleValueAction(ctx: StateContext<ModuleStateModel>, action: ToggleModuleValueAction) {

        const myUser = this.store.selectSnapshot(CoreState.getUser);
        const { user, field } = action.payload;

        if (this.allowOperation(myUser, user)) {
            this.blockUI.start();

            let flag = true;
            if (user[field]) flag = false;
            
            const clone = {...user};
            clone[field]=flag;

            const module = field.split('_')[0];
            const index = field.split('_')[1];
    
            return this.modulesService.updateModuleValue(user.id, module, index, flag).pipe(
                switchMap(() => ctx.dispatch(new RefreshElementModulesAction({user: clone, update: true}))),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'Module changes', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new RefreshElementModulesAction({user: user, update: false})
            ]);
        }
    }

    @Action(ClearFiltersModulesAction)
    clearFiltersModulesAction(ctx: StateContext<ModuleStateModel>) {
        const countries = this.store.selectSnapshot(CoreState.getCountries);
        const { userModulesAll } = ctx.getState();
        ctx.patchState({ countriesFilter: countries, statusFilter: ['ACTIVE', 'INACTIVE'], rolesFilter: ['Magios', 'Admins', 'NewJoiner'], usersModules: userModulesAll});
    }

    @Action(ApplyFilterModulesAction)
    applyFilterModulesAction(ctx: StateContext<ModuleStateModel>, action: ApplyFilterModulesAction) {
        const { userModulesAll } = ctx.getState();
        const { countriesFilter, statusFilter, usersFilter, rolesFilter } =  action.payload;

        const results: any[] = [];
        let countryFlag, statusFlag, userFlag, roleFlag;
        
        userModulesAll.forEach(u => {
            if (rolesFilter.length > 2) roleFlag = true;
            else if (u.roles.length > 1) roleFlag = includes(rolesFilter, 'Admins');
            else roleFlag = includes(rolesFilter, u.roles[0]);
            
            userFlag = includes(usersFilter, u.username);
            countryFlag = includes(countriesFilter, u.country);
            statusFlag = statusFilter.length > 1 || (statusFilter[0] == 'ACTIVE' && u.status) || (statusFilter[0] == 'INACTIVE' && !u.status);
            if (roleFlag && userFlag && countryFlag && statusFlag) results.push(u);
        });

        ctx.patchState({ countriesFilter, statusFilter, usersModules: results, usersFilter: usersFilter, rolesFilter: rolesFilter});
    }

    @Action(InitModulesAction)
    initModulesAction(ctx: StateContext<ModuleStateModel>) {

        const countries = this.store.selectSnapshot(CoreState.getCountries);

        this.blockUI.start();
        
        const results: any[] = [];
        let result: any;
        let i: number;

        return this.modulesService.getModules().pipe(
            tap(modules => ctx.patchState({modules}) ),
            switchMap(modules => {
                return this.modulesService.getModulesUser().pipe(
                    tap(users => {
                        users.forEach((u: any) => {
                            result = {id: u.id, username: u.username, roles: u.roles, avatar: u.avatar, status: u.status == true ? true: false, country: u.country ? u.country : '', refresh: new Date().getTime()};
        
                            for(let i = 0; i < modules.terrains.length; i++) 
                                result['terrains_'+i] = u.modules.find((m:any) => m == modules.terrains[i].name) ? true : false;
            
                            for(let i = 0; i < modules.jets.length; i++) 
                                result['jets_'+i] = u.modules.find((m:any) => m == modules.jets[i].name) ? true : false;
                    
                            for(let i = 0; i < modules.warbirds.length; i++) 
                                result['warbirds_'+i] = u.modules.find((m:any) => m == modules.warbirds[i].name) ? true : false;
                    
                            for(let i = 0; i < modules.helis.length; i++) 
                                result['helis_'+i] = u.modules.find((m:any) => m == modules.helis[i].name) ? true : false;;
                    
                            for(let i = 0; i < modules.others.length; i++) 
                                result['others_'+i] = u.modules.find((m:any) => m == modules.others[i].name) ? true : false;
        
                            results.push(result);
                        });
        
                        ctx.patchState({ countriesFilter: countries, usersModules: results, userModulesAll:results, usersFilter: results.map(r => r.username) });
                    }),
                    catchError(err => {
                        this.blockUI.stop();
                        return throwError(err)
                    }),
                    finalize(() =>  this.blockUI.stop() )
                )
            })
        )

    }

    @Selector()
    static getTableHeader() {
        return [
            'username', 'terrains_0', 'terrains_1', 'terrains_2', 'terrains_3', 'terrains_4',
            'jets_0', 'jets_1', 'jets_2', 'jets_3', 'jets_4', 'jets_5', 'jets_6', 'jets_7',
            'jets_8', 'jets_9', 'jets_10', 'jets_11', 'jets_12', 'jets_13', 'jets_14', 'jets_15', 
            'jets_16', 'jets_17', 'jets_18', 'jets_19', 'jets_20', 'jets_21', 'jets_22', 
            'warbirds_0', 'warbirds_1', 'warbirds_2', 'warbirds_3', 'warbirds_4', 'warbirds_5', 
            'warbirds_6', 'warbirds_7', 'helis_0', 'helis_1', 'helis_2', 'helis_3', 'helis_4', 
            'helis_5', 'others_0', 'others_1', 'others_2', 'others_3', 'others_4', 'others_5', 
        ]
    }

    @Selector()
    static getUsersModules(state: ModuleStateModel) {
        return state.usersModules;
    }

    @Selector()
    static getModules(state: ModuleStateModel) {
      return state.modules;
    }

    @Selector()
    static getUsers(state: ModuleStateModel) {
      return state.userModulesAll.map(u => u.username);
    }

    @Selector()
    static getSelectedFilters(state: ModuleStateModel) {
      return { 
          statusFilter: state.statusFilter, 
          countriesFilter: state.countriesFilter,
          usersFilter: state.usersFilter,
          rolesFilter: state.rolesFilter
        };
    }
}
