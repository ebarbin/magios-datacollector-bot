import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CoreState } from 'src/app/states/core.state';
import { faBars, faCheck } from '@fortawesome/free-solid-svg-icons';
import { DownloadNewUserGuideAction } from 'src/app/actions/core.action';

@Component({
  selector: 'app-new-user-dialog',
  templateUrl: './new-user-dialog.component.html',
  styleUrls: ['./new-user-dialog.component.scss']
})
export class NewUserDialogComponent implements OnInit {

  faBars = faBars;
  faCheck = faCheck;

  @Select(CoreState.getUser) getUser$: Observable<any> | undefined;

  currentPage = 1;

  constructor(private store: Store, private dialogRef: MatDialogRef<NewUserDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {}

  onClose() {
    this.dialogRef.close();
  }

  onBack(){
    this.currentPage--;
  }

  onNext() {
    this.currentPage++;
  }

  onDownloadNewUserGuide() {
    this.store.dispatch(new DownloadNewUserGuideAction());
  }
}
