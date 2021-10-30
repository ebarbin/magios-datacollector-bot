import { Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { DownloadNewUserGuideAction, LogoutAction, RedirectToDiscordGeneralChannelAction, RedirectToDiscordLoginAction } from 'src/app/actions/core.action';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { CoreState } from 'src/app/states/core.state';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  @Select(CoreState.isAdmin) isAdmin$: Observable<boolean> | undefined;
  @Select(CoreState.isNonNewUser) isNonNewUser$: Observable<boolean> | undefined;
  

  faSignOutAlt = faSignOutAlt;
  
  @Input() snav: MatSidenav | undefined;

  constructor(private store: Store, private router: Router) { }

  navigate(route:string) {
    this.snav?.toggle();
    this.router.navigate(['', route]);
  }

  ngOnInit(): void {}

  onLogout() {
    this.store.dispatch([
      new LogoutAction(),
      new RedirectToDiscordLoginAction()
    ]);
  }

  onDiscord(){
    this.store.dispatch([
      new RedirectToDiscordGeneralChannelAction()
    ]);
  }

  onDownloadUserGuide() {
    this.store.dispatch([
      new DownloadNewUserGuideAction()
    ]);
  }
}
