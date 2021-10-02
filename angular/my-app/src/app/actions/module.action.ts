export class InitModulesAction {
    static readonly type = '[Module] Init modules';
}

export class ToggleModuleValueAction {
    static readonly type = '[Module] Toogle module value';
    constructor(public payload: { user: any, field: string}) {}
}

export class ToggleUserStatusValueAction {
    static readonly type = '[Module] Toogle user status value';
    constructor(public payload: { user: any}) {}
}

export class UpdateCountryUserValueAction {
    static readonly type = '[Module] Update country user value value';
    constructor(public payload: { user: any, country: string}) {}
}