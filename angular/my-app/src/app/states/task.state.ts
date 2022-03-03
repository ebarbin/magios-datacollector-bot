import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { patch, updateItem } from "@ngxs/store/operators";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { zip } from "rxjs";
import { finalize, tap } from "rxjs/operators";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { InitTaskAction, RunTaskNowAction, ToggleTaskStatusAction } from "../actions/task.actions";
import { ModulesService } from "../services/modules.service";
import { ServerDataService } from "../services/server-data.services";
import { TaskService } from "../services/task.services";
import { UserService } from "../services/user.service";

export interface TaskStateModel {
    tasks: any
}
      
const initialState: TaskStateModel = { 
    tasks: []
};

  @State<TaskStateModel>({
      name: new StateToken<TaskStateModel>('task'),
      defaults: initialState
    })
  @Injectable()
  export class TaskState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(private taskService: TaskService, private modulesService: ModulesService, private userService: UserService) {}

    @Action(InitTaskAction)
    initTaskAction(ctx: StateContext<TaskStateModel>) {
        this.blockUI.start();
        
        return zip(
            this.taskService.getTasks()
            ).pipe(
                tap(responses => {
                    return ctx.patchState({ tasks: responses[0] })
                }),
                finalize(() => this.blockUI.stop() )
            )
    }

    @Action(ToggleTaskStatusAction)
    toggleTaskStatusAction(ctx: StateContext<TaskStateModel>, action: ToggleTaskStatusAction) {
        this.blockUI.start();
        const { values } = action.payload;
        return this.taskService.toggleTaskStatus(values).pipe(
            tap((response) => {
                ctx.setState(
                    patch({ tasks: updateItem<any>(task => task.id === values.id, response.task) })
                );
                ctx.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'Task update', type: MessageType.SUCCESS}));
                
            }),
            finalize(() => this.blockUI.stop() )
        )
    }

    @Action(RunTaskNowAction)
    runTaskNowAction(ctx: StateContext<TaskStateModel>, action: RunTaskNowAction) {
        this.blockUI.start();
        const { values } = action.payload;
        return this.taskService.runTaskNow(values).pipe(
            tap((response) => {
                ctx.setState(
                    patch({ tasks: updateItem<any>(task => task.id === values.id, response.task) })
                );
                ctx.dispatch(new ShowMessageAction({msg: 'Successful operation', title: 'Task update', type: MessageType.SUCCESS}));
                
            }),
            finalize(() => this.blockUI.stop() )
        )
    }
  

    @Selector()
    static getTasks(state: TaskStateModel) {
      return state.tasks;
    }

  }