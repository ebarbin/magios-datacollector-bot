import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dead-chart',
  templateUrl: './dead-chart.component.html',
  styleUrls: ['./dead-chart.component.scss']
})
export class DeadChartComponent implements OnInit {

  @Input() users: any;
  @Input() serverId: any;
  
  data: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.data = this.users.filter((u:any) => u.stats[this.serverId - 1].dead > 0 ).map((u:any) => {
      return {value: u.stats[this.serverId - 1].dead, name: u.username} 
    });
  }
}
