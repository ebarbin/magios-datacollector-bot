import { Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { LogoutAction } from 'src/app/actions/core.action';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  faSignOutAlt = faSignOutAlt;
  
  @Input() snav: MatSidenav | undefined;

  constructor(private store: Store, private router: Router) { }

  navigate(route:string) {
    this.snav?.toggle();
    this.router.navigate(['', route]);
  }

  ngOnInit(): void {}

  onLogout() {
    this.store.dispatch(new LogoutAction());
  }
}
