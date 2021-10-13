import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CoreState } from 'src/app/states/core.state';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { NewUserDialogComponent } from '../welcome/components/new-user-dialog/new-user-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss']
})
export class UserHeaderComponent implements OnInit {

  @Select(CoreState.isNewUser) isNewUser$: Observable<any> | undefined;
  faQuestion = faQuestion;
  
  @Select(CoreState.getUser) getUser$: Observable<any> | undefined;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {}

  onHelp() {
    this.dialog.open(NewUserDialogComponent, { width: '40%', disableClose: false, hasBackdrop: true} );
  }

}
