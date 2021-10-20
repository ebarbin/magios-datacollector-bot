import { Component, Input, OnInit } from '@angular/core';
import { groupBy, sortBy } from 'lodash';

@Component({
  selector: 'app-country-chart',
  templateUrl: './country-chart.component.html',
  styleUrls: ['./country-chart.component.scss']
})
export class CountryChartComponent implements OnInit {

  @Input() users: any;
  
  data: any[] = [];
  constructor() { }

  ngOnInit(): void {
    const raw = groupBy(this.users.filter((u:any) => u.country && u.country != undefined), 'country');
    for (let prop in raw) {
      this.data.push({ name: prop, value: raw[prop].length }); 
    }
    this.data = sortBy(this.data, ['name']);
  }
}
