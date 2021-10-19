export class InitServerDataAction {
    static readonly type = '[Server data] Init';
}

export class UpdateServerDataAction {
    static readonly type = '[Server data] Update';
    constructor(public payload: { values:any }) {}
}