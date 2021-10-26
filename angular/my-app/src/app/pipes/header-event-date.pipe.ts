import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'headerEventDate'
})
export class HeaderEventDatePipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    return moment(value, 'DDMMYYYY').format('DD/MM/YYYY')
  }

}
