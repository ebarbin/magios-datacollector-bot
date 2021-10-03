import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { catchError, finalize, switchMap, tap } from "rxjs/operators";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { ModulesService } from "../services/modules.service";
import { CoreState } from "./core.state";
import { InitModulesAction, RefreshElementModulesAction, ShowHideModulesAction, ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from "../actions/module.action";

import { patch, updateItem } from '@ngxs/store/operators';
import { throwError } from "rxjs";

export interface ModuleStateModel {
    modules: any
    usersModules: any[]
}
  
const initialState: ModuleStateModel = {
    modules: {},
    usersModules: []
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
        const { user } = action.payload;

        if (this.allowOperation(myUser, user)) {
            
            this.blockUI.start();
            
            const {country} = action.payload;
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
    ShowHideModulesAction(ctx: StateContext<ModuleStateModel>, action: ShowHideModulesAction) {
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
        const { user } = action.payload;
        const { field } = action.payload;
        

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

    @Action(InitModulesAction)
    initModulesAction(ctx: StateContext<ModuleStateModel>) {

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
                            result = {id: u.id, username: u.username, avatar: u.avatar, status: u.status, country: u.country, refresh: new Date().getTime()};
        
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
        
                        ctx.patchState({usersModules: results})
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
}
