import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { patch, updateItem } from "@ngxs/store/operators";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { finalize, tap } from "rxjs/operators";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { InitServerDataAction, UpdateServerDataAction } from "../actions/server-data.actions";
import { ServerDataService } from "../services/server-data.services";

export interface ServerDataStateModel {
    servers: any 
}
      
const initialState: ServerDataStateModel = { 
    servers: []
};

const CORE_STATE_TOKEN = new StateToken<ServerDataStateModel>('serverdata');
  @State<ServerDataStateModel>({
      name: CORE_STATE_TOKEN,
      defaults: initialState
    })
  @Injectable()
  export class ServerDataState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private serverDataService: ServerDataService) {}

    @Action(InitServerDataAction)
    initServerDataAction(ctx: StateContext<ServerDataStateModel>) {
        this.blockUI.start();
        return this.serverDataService.getServers().pipe(
            tap(servers => {
                ctx.patchState({ servers })
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
  }