import { Injectable, NgZone } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Action, Selector, State, StateContext, StateToken, Store } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";
import { finalize, map, switchMap, tap } from "rxjs/operators";
import { zip } from "rxjs";
import { InitAppAction, MessageType, ShowMessageAction } from "../actions/core.action";
import { ModulesService } from "../services/modules.service";
import { CoreState } from "./core.state";
import { InitModulesAction, ToggleModuleValueAction, ToggleUserStatusValueAction, UpdateCountryUserValueAction } from "../actions/module.action";
import { ThrowStmt } from "@angular/compiler";

export interface ModuleStateModel {
    modules: string[]
    usersModules: any[]
}
  
const initialState: ModuleStateModel = {
    modules: [],
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
        private ngZone: NgZone,
        private toastrService: ToastrService,
        private modulesService: ModulesService,
        private translate: TranslateService) {}

        
    @Action(ToggleUserStatusValueAction)
    toggleUserStatusValueAction(ctx: StateContext<ModuleStateModel>, action: ToggleUserStatusValueAction) {

        const myUser = this.store.selectSnapshot(CoreState.getUser);
        const { user } = action.payload;

        if (this.allowOperation(myUser, user)) {
            
            return this.modulesService.updateUserStatus(user.id).pipe(
                switchMap(() => ctx.dispatch(new InitModulesAction())),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'User status update', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new InitModulesAction()
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

            return this.modulesService.updateUserCountry(user.id, country).pipe(
                switchMap(() => ctx.dispatch(new InitModulesAction())),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'User country update', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new InitModulesAction()
            ]);
        }
    }

    
        
    @Action(ToggleModuleValueAction)
    toggleModuleValueAction(ctx: StateContext<ModuleStateModel>, action: ToggleModuleValueAction) {

        const myUser = this.store.selectSnapshot(CoreState.getUser);
        const { user } = action.payload;

        if (this.allowOperation(myUser, user)) {
            this.blockUI.start();

            const {field} = action.payload;
    
            let flag = true;
            if (user[field] != null) {
                flag = false
            }
            
            const module = field.split('_')[0];
            const index = field.split('_')[1];
    
            return this.modulesService.updateModuleValue(user.id, module, index, flag).pipe(
                switchMap(() => ctx.dispatch(new InitModulesAction())),
                finalize(() => {
                    this.blockUI.stop();
                    return this.store.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'Module changes', type: MessageType.SUCCESS}));
                })
            )
        } else {
            return this.store.dispatch([
                new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}),
                new InitModulesAction()
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
            tap(modules => ctx.patchState({modules: modules}) ),
            switchMap(modules => {
                return this.modulesService.getModulesUser().pipe(
                    tap(users => {
                        users.forEach((u: any) => {
                            result = {id: u.id, username: u.username, avatar: u.avatar, status: u.status, country: u.country};
        
                            i = 0;
                            modules.terrains.forEach((t:string) => {
                                result['terrains_'+i] = u.modules.find((m:any) => m == t);
                                i++;
                            });
                    
                            i = 0;
                            modules.jets.forEach((t:string) => {
                                result['jets_'+i] = u.modules.find((m:any) => m == t);
                                i++;
                            });
                    
                            i = 0;
                            modules.warbirds.forEach((t:string) => {
                                result['warbirds_'+i] = u.modules.find((m:any) => m == t);
                                i++;
                            });
                    
                            i = 0;
                            modules.helis.forEach((t:string) => {
                                result['helis_'+i] = u.modules.find((m:any) => m == t);
                                i++;
                            });
                    
                            i = 0;
                            modules.others.forEach((t:string) => {
                                result['others_'+i] = u.modules.find((m:any) => m == t);
                                i++;
                            });
        
                            results.push(result);
                        });
        
                        ctx.patchState({usersModules: results})
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
