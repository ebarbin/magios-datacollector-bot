import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-accuracy-chart',
  templateUrl: './accuracy-chart.component.html',
  styleUrls: ['./accuracy-chart.component.scss']
})
export class AccuracyChartComponent implements OnInit {

  @Input() users: any;
  @Input() serverId: any;
  
  data: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.data = this.users.filter((u:any) => u.stats[this.serverId - 1].shot > 0 ).map((u:any) => {
      let value = (u.stats[this.serverId - 1].hit / u.stats[this.serverId - 1].shot) * 100;
      return {value: value > 100 ? 100 : value , name: u.username} 
    });
  }
}
