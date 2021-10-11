import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { MessageType, ShowMessageAction } from '../actions/core.action';
import { CoreState } from '../states/core.state';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  @Select(CoreState.hasUser) hasUser$: Observable<boolean> | undefined;

  constructor() { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      return this.hasUser$ || false;
  }
  
}
