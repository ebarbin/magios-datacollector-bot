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