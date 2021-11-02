import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UpdateServerDataAction } from 'src/app/actions/server-data.actions';
import { includes } from 'lodash';
@Component({
  selector: 'app-server-form',
  templateUrl: './server-form.component.html',
  styleUrls: ['./server-form.component.scss']
})
export class ServerFormComponent implements OnInit {

  myControl = new FormControl();
  filteredOptions$: Observable<any[]> | undefined;

  @Input() users: any;
  @Input() user: any;
  @Input() server: any;
  @Input() terrains: any;

  form: any;

  constructor(private store: Store, private fb: FormBuilder) { }

  ngOnInit(): void {    
    this.form = this.fb.group({
      id: [''],
      name: ['',Validators.required],
      ip: ['',Validators.required],
      map: ['',Validators.required],
      password: ['',Validators.required], 
      description: [''],
      hours: [''],
      tacview: [''],
      others: [''],
      srs: [false],
      atis: [false],
      owner: ['', [Validators.required, this.customValidation]]
    });

    const sv = {...this.server};
    const user = this.users.find((u:any) => u.id == sv.owner);
    sv.owner = user;
    this.myControl.setValue(user ? user.username : "");

    this.form.patchValue(sv);

    if (!includes(this.user.roles, 'Admins') && this.user.id != this.server.owner) {
      this.form.disable();
    }

    this.filteredOptions$ = this.form.controls.owner.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  customValidation(control: AbstractControl) {
    if (typeof control.value === 'object') return null;
    else return { invalidSelection: true }
  }
  displayFn(user: any){
    if (user != null) return user.username;
    else return "";
  }
  
  private _filter(value: any): any[] {
    let filterValue = "";
    if (typeof value === 'object'){
      filterValue = value.username.toLowerCase();
    } else {
      filterValue = value.toLowerCase();
    }
    return this.users.filter((u: any) => u.username.toLowerCase().includes(filterValue));
  }

  onSave() {
    const req = this.form.value;
    req.owner = req.owner.id;
    this.store.dispatch(new UpdateServerDataAction({ values: this.form.value }))
  }

}
