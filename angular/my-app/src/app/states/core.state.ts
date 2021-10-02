import { Injectable, NgZone } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";
import { InitAppAction, MessageType, ShowMessageAction } from "../actions/core.action";
import { environment } from "src/environments/environment";

export interface CoreStateModel {
  user: any,
}
  
const initialState: CoreStateModel = {
  user: null
};

const CORE_STATE_TOKEN = new StateToken<CoreStateModel>('core');

@State<CoreStateModel>({
    name: CORE_STATE_TOKEN,
    defaults: initialState
  })
@Injectable()
export class CoreState {

    @BlockUI() blockUI!: NgBlockUI;

    constructor(
        private ngZone: NgZone,
        private toastrService: ToastrService,
        private translate: TranslateService) {}

    @Action(InitAppAction)
    initAppAction(ctx: StateContext<CoreStateModel>) {

      let user = {
        avatar: "7ab409b7aef9ba3a9204048272102ca4",
        id: "731248994159689818",
        joinDate: "01/01/2021 13:00:00",
        joinVoiceChannelCount: 56,
        lastServerAccess: "27/09/2021 22:00:02",
        lastServerAccessIp: "191.97.154.106:57084",
        lastServerId: "2",
        lastTextChannelDate: "02/10/2021 11:37:45",
        lastTextChannelName: "general",
        lastVoiceChannelAccessDate: "29/09/2021 22:12:35",
        lastVoiceChannelName: "General",
        modules: ['Syria', 'Persian Gulf', 'Nevada', 'CA', 'F/A-18C', 'JF-17', 'M-2000C', 'AV-8B', 'F-14', 'UH-1H'],
        msgChannelCount: 510,
        roles: ['Admins', 'Magios'],
        username: "emucho [emma]",
        voiceChannelTotalTime: "0223856456536315062332503943138591695",
      }

      if (environment.production) {
        const value = document.cookie.replace(/(?:(?:^|.*;\s*)user\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        user = JSON.parse(decodeURIComponent(value));
      }

      ctx.patchState({ user });
    }

    @Action(ShowMessageAction)
    showMessageAction(ctx: StateContext<CoreStateModel>, action: ShowMessageAction) {
  
      const { msg, title, type, options } = action.payload;
  
      const translatedMsg = this.translate.instant(msg);
      const translatedTitle = title ? this.translate.instant(title) : title;
  
      return this.ngZone.run( () => {
        switch (type) {
          case MessageType.ERROR:
            this.toastrService.error(translatedMsg, translatedTitle, options)
            break;
  
          case MessageType.WARNING:
            this.toastrService.warning(translatedMsg, translatedTitle, options)
            break;
  
          case MessageType.INFO:
            this.toastrService.info(translatedMsg, translatedTitle, options)
            break;
  
          default:
            this.toastrService.success(translatedMsg, translatedTitle, options)
            break;
        }
      });
    }

    @Selector()
    static getUser(state: CoreStateModel) {
      return state.user;
    }

    @Selector()
    static getCountries() {
      return ['Argentina','Bolivia', 'Chile', 'Colombia', 'Cuba', 'Ecuador', 'España', 'Estados Unidos', 'Guatemala', 'Uruguay']
    }

}