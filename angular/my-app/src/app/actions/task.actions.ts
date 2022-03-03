export class InitTaskAction {
    static readonly type = '[Task] Init';
}


export class ToggleTaskStatusAction {
    static readonly type = '[Task] Toggle status';
    constructor(public payload: { values:any }) {}
}

export class RunTaskNowAction {
    static readonly type = '[Task] Run now';
    constructor(public payload: { values:any }) {}
}