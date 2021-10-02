import { Component, Input, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  @Input() snav: MatSidenav | undefined;

  constructor(private router: Router) { }

  navigate(route:string) {
    this.snav?.toggle();
    this.router.navigate(['', route]);
  }

  ngOnInit(): void {
  }

}
