import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { UpdateServerDataAction } from 'src/app/actions/server-data.actions';

@Component({
  selector: 'app-server-form',
  templateUrl: './server-form.component.html',
  styleUrls: ['./server-form.component.scss']
})
export class ServerFormComponent implements OnInit {

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
      others: [''],
      srs: [false],
      atis: [false],
    });

    this.form.patchValue(this.server);
  }

  onSave() {
    this.store.dispatch(new UpdateServerDataAction({ values: this.form.value }))
  }

}
