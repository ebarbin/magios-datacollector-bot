import {Injectable} from "@angular/core";
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor,HttpRequest} from '@angular/common/http';
import {Observable, throwError} from "rxjs";
import {catchError} from 'rxjs/operators';
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { environment } from "src/environments/environment";
 
@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
    
    @BlockUI() blockUI!: NgBlockUI;

    constructor(public router: Router, private store: Store ) {}
 
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
 
    const user = localStorage.getItem('user');
    if (user) {
      req = this.addAuthenticationData(req, JSON.parse(user))
    }

    return next.handle(req).pipe(
      catchError((errorResponse) => {
          this.blockUI.stop();
        if (errorResponse instanceof HttpErrorResponse) {
            if (errorResponse.error instanceof ErrorEvent) {
                this.store.dispatch( new ShowMessageAction({ msg: 'Error Event', type: MessageType.ERROR}) );
            } else {
                this.store.dispatch( new ShowMessageAction({ msg: errorResponse.statusText, type: MessageType.ERROR}) );
                if (errorResponse.status == 401) {
                  setTimeout(() => {
                    window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
                  }, 1000);
                }
            } 
        } else {
            this.store.dispatch( new ShowMessageAction({ msg: 'Some thing else happened', type: MessageType.ERROR}) );
        }
        return throwError(errorResponse);
      }) 
    )
  }

  private addAuthenticationData(request: HttpRequest<any>, user: any) {
    return request.clone({ setHeaders: { userId: user.id } });
  }
}