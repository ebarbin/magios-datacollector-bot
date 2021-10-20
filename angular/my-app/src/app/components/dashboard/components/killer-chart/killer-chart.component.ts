import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-killer-chart',
  templateUrl: './killer-chart.component.html',
  styleUrls: ['./killer-chart.component.scss']
})
export class KillerChartComponent implements OnInit {

  @Input() users: any;
  @Input() serverId: any;
  
  data: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.data = this.users.filter((u:any) => u.stats[this.serverId - 1].kill > 0 ).map((u:any) => {
      return {value: u.stats[this.serverId - 1].kill, name: u.username} 
    });
  }
}
