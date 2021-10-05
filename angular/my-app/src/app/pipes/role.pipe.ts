import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'role'
})
export class RolePipe implements PipeTransform {

  transform(value: string[], ...args: unknown[]): unknown {
    if (value.length > 0) return value[0];
    else return '-';
  }

}
