import { Component, Input, OnInit } from '@angular/core';
import { includes } from 'lodash';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss']
})
export class RoleComponent implements OnInit {

  @Input() user: any;
  constructor() { }

  ngOnInit(): void {}

  isAdmin(roles: string[]) {
    return includes(roles, 'Admins');
  }

  isMagio(roles: string[]) {
    return includes(roles, 'Magios') && !includes(roles, 'Admins');
  }

  isNewJoiner(roles: string[]) {
    return includes(roles, 'NewJoiner');
  }

  isLimbo(roles: string[]) {
    return includes(roles, 'Limbo');
  }
}
