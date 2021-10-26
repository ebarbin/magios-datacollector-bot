import { Component, Input, OnInit } from '@angular/core';
import { faPlaneDeparture, faPlaneArrival, faSignInAlt, faSignOutAlt, faBahai, faSkullCrossbones, faDizzy, faPlaneSlash, faCrosshairs } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-event-type',
  templateUrl: './event-type.component.html',
  styleUrls: ['./event-type.component.scss']
})
export class EventTypeComponent implements OnInit {

  @Input() event:any;
  icon:any;

  constructor() { }

  ngOnInit(): void {
    if (this.event.type == 'takeoff') {
      this.icon = faPlaneDeparture;
    } else if (this.event.type == 'land') {
      this.icon = faPlaneArrival;
    } else if (this.event.type == 'connect') {
      this.icon = faSignInAlt;
    } else if (this.event.type == 'relinquished') {
      this.icon = faSignOutAlt;
    } else if (this.event.type == 'shot') {
      this.icon = faBahai;
    } else if (this.event.type == 'kill') {
      this.icon = faSkullCrossbones;
    } else if (this.event.type == 'dead') {
      this.icon = faDizzy;
    } else if (this.event.type == 'crash') {
      this.icon = faPlaneSlash;
    } else if (this.event.type == 'hit') {
      this.icon = faCrosshairs;
    }
    
  }

}
