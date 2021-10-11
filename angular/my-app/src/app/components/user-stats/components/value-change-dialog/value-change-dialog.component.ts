import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ApplyChangeUserStatsAction } from 'src/app/actions/user-stats.action';

@Component({
  selector: 'app-value-change-dialog',
  templateUrl: './value-change-dialog.component.html',
  styleUrls: ['./value-change-dialog.component.scss']
})
export class ValueChangeDialogComponent implements OnInit {

  input:any;

  constructor(private store: Store, private dialogRef: MatDialogRef<ValueChangeDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.input = this.data.value;
  }

  onAccept() {
    this.data.user[this.data.field] = this.input;
    this.store.dispatch(new ApplyChangeUserStatsAction({user: this.data.user}));
    this.dialogRef.close();
  }

}
