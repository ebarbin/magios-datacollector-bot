import { Sort } from "@angular/material/sort";

export class InitUserStatsAction {
    static readonly type = '[User stats] Init';
}

export class ClearFiltersUserStatsAction {
    static readonly type = '[User stats] Clear filters';
}


export class ApplyFilterUserStatsAction {
    static readonly type = '[User stats] Apply filter';
    constructor(public payload: { userFilter: string, rolesFilter: string[]}) {}
}

export class SortUserStatsAction {
    static readonly type = '[User stats] Sort user stats';
    constructor(public payload: { sort: Sort}) {}
}

export class ApplyChangeUserStatsAction {
    static readonly type = '[User stats] Apply change user stats';
    constructor(public payload: { user: any}) {}
}

export class ShowUserServerEventTabsAction {
    static readonly type = '[User stats] Show user server event tabs';
    constructor(public payload: { user: any}) {}
}


