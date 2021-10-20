import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-crash-chart',
  templateUrl: './crash-chart.component.html',
  styleUrls: ['./crash-chart.component.scss']
})
export class CrashChartComponent implements OnInit {

  @Input() users: any;
  @Input() serverId: any;
  
  data: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.data = this.users.filter((u:any) => u.stats[this.serverId - 1].crash > 0 ).map((u:any) => {
      return {value: u.stats[this.serverId - 1].crash, name: u.username} 
    });
  }
}
