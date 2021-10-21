import {Injectable} from "@angular/core";
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor,HttpRequest} from '@angular/common/http';
import {Observable, throwError} from "rxjs";
import {catchError} from 'rxjs/operators';
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { MessageType, ShowMessageAction } from "../actions/core.action";
import { BlockUI, NgBlockUI } from "ng-block-ui";
import { environment } from "src/environments/environment";
import { Navigate } from "@ngxs/router-plugin";
 
@Injectable()
export class GlobalHttpInterceptor implements HttpInterceptor {
    
    @BlockUI() blockUI!: NgBlockUI;

    constructor(public router: Router, private store: Store ) {}
 
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
 
    const token = localStorage.getItem('token');
    if (token) req = this.addAuthenticationData(req, token);

    return next.handle(req).pipe(
      catchError((response) => {
          this.blockUI.stop();
          if (response.error && response.error.errorDesc) {
            this.store.dispatch( new ShowMessageAction({ msg: response.error.errorDesc, type: MessageType.ERROR}) );
          } else {
            if (response instanceof HttpErrorResponse) {
              if (response.error instanceof ErrorEvent) {
                  this.store.dispatch( new ShowMessageAction({ msg: 'Error Event', type: MessageType.ERROR}) );
              } else {
                  this.store.dispatch( new ShowMessageAction({ msg: response.statusText, type: MessageType.ERROR}) );
                  if (response.status == 401) {
                    this.store.dispatch(new Navigate(['error401']));
                    setTimeout(() => {
                      window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id='+environment.client_id+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(environment.oauth_redirect);
                    }, 1000);
                  }
              } 
            } else {
                this.store.dispatch( new ShowMessageAction({ msg: 'Some thing else happened', type: MessageType.ERROR}) );
            }
          }
        return throwError(response);
      }) 
    )
  }

  private addAuthenticationData(request: HttpRequest<any>, token: string ) {
    return request.clone({ setHeaders: { 'access-token': token } });
  }
}