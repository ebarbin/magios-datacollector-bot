import { Injectable, NgZone } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";
import { InitAppAction, LogoutAction, MessageType, ShowMessageAction } from "../actions/core.action";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { includes } from 'lodash';

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
        private http: HttpClient,
        private ngZone: NgZone,
        private toastrService: ToastrService,
        private translate: TranslateService) {}

    @Action(InitAppAction)
    initAppAction(ctx: StateContext<CoreStateModel>) {
      
      if (window.location.href.indexOf('/oauth/redirect') >=0) {
        const code = window.location.href.split('=')[1];

        this.http.post<any>(environment.api + '/oauth/redirect', {code: code }).subscribe((response:any) => {
          if (response.allow) {
            localStorage.setItem('user', JSON.stringify(response.user));
            ctx.patchState({ user: response.user })
          } else {
            ctx.dispatch(new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}));
            setTimeout(() => {
              window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
            }, 1000);
          }
        });

      } else {
        const user = localStorage.getItem('user');
        if (!user) {
          window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
        } else {
          ctx.patchState({ user: JSON.parse(user) })
        }
      }
    }

    @Action(LogoutAction)
    logoutAction(ctx: StateContext<CoreStateModel>) {
      localStorage.removeItem('user');
      ctx.dispatch(new ShowMessageAction({msg: 'You are going out', title: 'Attention', type: MessageType.WARNING}));
      setTimeout(() => {
        window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
      }, 1000);
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

    @Selector([CoreState.getUser])
    static isAdmin(user: any) {
      return includes(user.roles, 'Admins');
    }

    @Selector()
    static getCountries() {
      return [
        { name:'', code:'', css:'' },
        { name:'Argentina', code:'ar', css:'flag-icon-ar' },
        { name:'Bolivia', code:'bo', css:'flag-icon-bo' },
        { name:'Chile', code:'cl', css:'flag-icon-cl' },
        { name:'Colombia', code:'co', css:'flag-icon-co' },
        { name:'Cuba', code:'cu', css:'flag-icon-cu' },
        { name:'Ecuador', code:'ec', css:'flag-icon-ec' },
        { name:'España', code:'es', css:'flag-icon-es' },
        { name:'Estados Unidos', code:'us', css:'flag-icon-us' },
        { name:'Guatemala', code:'gt', css:'flag-icon-gt' },
        { name:'Mexico', code:'mx', css:'flag-icon-mx' },
        { name:'Uruguay', code:'uy', css:'flag-icon-uy' }
      ]
    }

}