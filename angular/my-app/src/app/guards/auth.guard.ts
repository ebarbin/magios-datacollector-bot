import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { MessageType, ShowMessageAction } from '../actions/core.action';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private store: Store) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const user = localStorage.getItem('user');
      if (user) {
        return true;
      } else {
        this.store.dispatch(new ShowMessageAction({msg: 'You are not allow', title: 'Permission', type: MessageType.ERROR}));
        return false;
      }
  }
  
}
