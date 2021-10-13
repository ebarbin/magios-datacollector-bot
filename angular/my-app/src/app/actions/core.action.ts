export enum MessageType {
    SUCCESS, ERROR, WARNING, INFO
}

export class InitAppAction {
    static readonly type = '[Core] Init app';
}

export class ShowMessageAction {
    static readonly type = '[Core] Show Message';
    constructor(public payload: { msg: string, title?: string, type?: MessageType, options?: any}) {}
}

export class LogoutAction {
    static readonly type = '[Core] Logout';
}

export class RedirectToDiscordLoginAction {
    static readonly type = '[Core] Redirect to discord login';
}

export class RedirectToDiscordGeneralChannelAction {
    static readonly type = '[Core] Redirect to Los Magios discord general channel';
}