import { Injectable, NgZone } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Action, Selector, State, StateContext, StateToken } from "@ngxs/store";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { ToastrService } from "ngx-toastr";
import { ChangeAppLanguageAction, DownloadNewUserGuideAction, InitAppAction, LogoutAction, MessageType, RedirectToDiscordGeneralChannelAction, RedirectToDiscordLoginAction, RedirectToDiscordWelcomeChannelAction, ShowMessageAction } from "../actions/core.action";
import { environment } from "src/environments/environment";
import { includes, sortBy } from 'lodash';
import { LoginService } from "../services/login.service";
import { finalize, tap } from "rxjs/operators";
import { EMPTY } from "rxjs";

export interface CoreStateModel { user: any, lang: any }
  
const initialState: CoreStateModel = { user: null, lang: null };

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
        private loginService: LoginService,
        private toastrService: ToastrService,
        private translate: TranslateService) {}

    @Action(InitAppAction)
    initAppAction(ctx: StateContext<CoreStateModel>) {
      
      ctx.patchState({lang: 'es' });
      this.translate.use('es');

      this.blockUI.start();

      if (window.location.href.indexOf('/oauth/redirect') >=0) {
        const code = window.location.href.split('=')[1];

        return this.loginService.login(code).pipe(
          tap((response:any) => {
              localStorage.setItem('token', response.token);
              localStorage.setItem('user', JSON.stringify(response.user));
              ctx.patchState({ user: response.user })
          }),
          finalize(() => this.blockUI.stop() )
        )

      } else {
        this.blockUI.stop();

        const user:any = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!user && !token) {

          window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
          return EMPTY;

        } else {
          return ctx.patchState({ user: JSON.parse(user)  })
        }
      }
    }

    @Action(LogoutAction)
    logoutAction(ctx: StateContext<CoreStateModel>) {
      this.blockUI.start();
      return this.loginService.logout().pipe(
        tap(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }),
        finalize(() => this.blockUI.stop() )
      )
    }

    @Action(RedirectToDiscordLoginAction)
    redirectToDiscordLoginAction(ctx: StateContext<CoreStateModel>) {
      setTimeout(() => {
        window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
      }, 1000);
    }

    @Action(RedirectToDiscordGeneralChannelAction)
    redirectToDiscordGeneralChannelAction(ctx: StateContext<CoreStateModel>) {
      setTimeout(() => {
        window.location.href = 'https://discord.com/channels/628750110821449739/841520992182730792';
      }, 1000);
    }

    @Action(RedirectToDiscordWelcomeChannelAction)
    redirectToDiscordWelcomeChannelAction(ctx: StateContext<CoreStateModel>) {
      setTimeout(() => {
        window.location.href = 'https://discord.com/channels/628750110821449739/822928591514894346';
      }, 1000);
    }

    @Action(DownloadNewUserGuideAction)
    downloadNewUserGuideAction(ctx: StateContext<CoreStateModel>) {
      setTimeout(() => {
        window.location.href = environment.api + '/new-users-guide.pdf';
      }, 1000);
    }

    @Action(ChangeAppLanguageAction)
    changeAppLanguageAction(ctx: StateContext<CoreStateModel>, action: ChangeAppLanguageAction) {
      const { values } = action.payload;
      ctx.patchState({lang: values.lang});
      this.translate.use(values.lang);
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
    static getLang(state: CoreStateModel) {
      return state.lang;
    }

    @Selector([CoreState.getUser])
    static hasUser(user: any) {
      return user != null;
    }

    @Selector([CoreState.getUser])
    static isNewUser(user: any) {
      return user != null && (user.roles == null || user.roles.length == 0 || includes(user.roles, 'Limbo'));
    }

    @Selector([CoreState.isNewUser])
    static isNonNewUser(isNewUser: boolean) {
      return !isNewUser;
    }

    @Selector([CoreState.getUser])
    static isAdmin(user: any) {
      return user != null && includes(user.roles, 'Admins');
    }

    @Selector()
    static getCountries() {
      return [
        { name:'', code:'', css:'' },
        { name:'Argentina', code:'ar', css:'flag-icon-ar', lang: 'es' },
        { name:'Bolivia', code:'bo', css:'flag-icon-bo', lang: 'es' },
        { name:'Brasil', code:'br', css:'flag-icon-br', lang: 'es' },
        { name:'Canada', code:'ca', css:'flag-icon-ca', lang: 'en' },
        { name:'Chile', code:'cl', css:'flag-icon-cl', lang: 'es' },
        { name:'Colombia', code:'co', css:'flag-icon-co', lang: 'es' },
        { name:'Costa Rica', code:'cr', css:'flag-icon-cr', lang: 'es' },
        { name:'Cuba', code:'cu', css:'flag-icon-cu', lang: 'es' },
        { name:'Ecuador', code:'ec', css:'flag-icon-ec', lang: 'es' },
        { name:'España', code:'es', css:'flag-icon-es', lang: 'es' },
        { name:'Estados Unidos', code:'us', css:'flag-icon-us', lang: 'en' },
        { name:'Guatemala', code:'gt', css:'flag-icon-gt', lang: 'es' },
        { name:'Mexico', code:'mx', css:'flag-icon-mx', lang: 'es' },
        { name:'Perú', code:'pe', css:'flag-icon-pe', lang: 'es' },
        { name:'Puerto Rico', code:'pr', css:'flag-icon-pr', lang: 'es' },
        { name:'Uruguay', code:'uy', css:'flag-icon-uy', lang: 'es' }
      ]
    }

    @Selector([CoreState.getCountries])
    static getSortedCountries(countries: any[]) {
      return sortBy(countries.filter(c => c.code != ''), ['name']);
    }

    @Selector([CoreState.getCountries])
    static getRawSortedCountries(countries: any[]) {
      return sortBy(countries, ['name']);
    }
}