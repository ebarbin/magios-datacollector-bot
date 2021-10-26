import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'eventDate'
})
export class EventDatePipe implements PipeTransform {

  transform(value: moment.Moment, ...args: unknown[]): unknown {
    return value.format('HH:mm:ss A');
  }

}
