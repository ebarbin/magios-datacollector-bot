import { Sort } from "@angular/material/sort";

export class InitModulesAction {
    static readonly type = '[Module] Init modules';
}

export class RefreshElementModulesAction {
    static readonly type = '[Module] Refresh element modules';
    constructor(public payload: { user: any, update: boolean}) {}
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
    static readonly type = '[Module] Update country user value';
    constructor(public payload: { user: any, country: string}) {}
}

export class SortUsersModuleAction {
    static readonly type = '[Module] Sort users module';
    constructor(public payload: { sort: Sort}) {}
}

export class ShowHideModulesAction {
    static readonly type = '[Module] Show hide modules';
    constructor(public payload: { categories: any}) {}
}
export class ApplyFilterModulesAction {
    static readonly type = '[Module] Apply filter modules';
    constructor(public payload: { countriesFilter: string[], statusFilter: string[], userFilter: string, rolesFilter: string[], modulesFilter: string[]}) {}
}

export class FilterByUserModulesAction {
    static readonly type = '[Module] Filter by user modules';
}

export class ClearFiltersModulesAction {
    static readonly type = '[Module] Clear filters modules';
}

export class ClearFilterSelection {
    static readonly type = '[Module] Clear filter selection';
    constructor(public payload: { filter: string }) {}
}

export class RegisterUserAction {
    static readonly type = '[Module] Register user';
}

export class ToggleLockStatusAction {
    static readonly type = '[Module] Toggle lock status';
}