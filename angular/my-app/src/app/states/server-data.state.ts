import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { patch, updateItem } from "@ngxs/store/operators";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { zip } from "rxjs";
import { finalize, tap } from "rxjs/operators";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { InitServerDataAction, UpdateServerDataAction } from "../actions/server-data.actions";
import { ModulesService } from "../services/modules.service";
import { ServerDataService } from "../services/server-data.services";
import { UserService } from "../services/user.service";

export interface ServerDataStateModel {
    servers: any,
    terrains: any,
    users: any
}
      
const initialState: ServerDataStateModel = { 
    servers: [],
    terrains: [],
    users: []
};
  @State<ServerDataStateModel>({
      name: new StateToken<ServerDataStateModel>('serverdata'),
      defaults: initialState
    })
  @Injectable()
  export class ServerDataState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private serverDataService: ServerDataService, private modulesService: ModulesService, private userService: UserService) {}

    @Action(InitServerDataAction)
    initServerDataAction(ctx: StateContext<ServerDataStateModel>) {
        this.blockUI.start();
        
        return zip(
            this.userService.getAllUsers(),
            this.serverDataService.getServers(),
            this.modulesService.getModules()
            ).pipe(
                tap(responses => {
                    return ctx.patchState({ users: responses[0], servers: responses[1], terrains: responses[2].terrains })
                }),
                finalize(() => this.blockUI.stop() )
            )
    }

    @Action(UpdateServerDataAction)
    updateServerDataAction(ctx: StateContext<ServerDataStateModel>, action: UpdateServerDataAction) {
        this.blockUI.start();
        const { values } = action.payload;
        return this.serverDataService.updateServer(values).pipe(
            tap(() => {
                ctx.setState(
                    patch({ servers: updateItem<any>(server => server.id === values.id, values) })
                );
                ctx.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'Server info update', type: MessageType.SUCCESS}));
                
            }),
            finalize(() => this.blockUI.stop() )
        )
    }

    @Selector()
    static getServers(state: ServerDataStateModel) {
      return state.servers;
    }

    @Selector()
    static getTerrains(state: ServerDataStateModel) {
      return state.terrains;
    }

    @Selector()
    static getUsers(state: ServerDataStateModel) {
      return state.users;
    }
  }