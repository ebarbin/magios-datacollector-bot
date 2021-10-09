import { Sort } from "@angular/material/sort";

export class GetAllUsersAction {
    static readonly type = '[User stats] Gell all users';
}

export class SortUserStatsAction {
    static readonly type = '[User stats] Sort user stats';
    constructor(public payload: { sort: Sort}) {}
}
