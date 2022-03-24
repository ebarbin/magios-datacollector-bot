import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { ChangeAppLanguageAction } from 'src/app/actions/core.action';
import { CoreState } from 'src/app/states/core.state';
import { NewUserDialogComponent } from './components/new-user-dialog/new-user-dialog.component';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {

  @Select(CoreState.isNewUser) isNewUser$: Observable<any> | undefined;
  @Select(CoreState.getLang) getLang$: Observable<any> | undefined;
  @Select(CoreState.getSortedCountries) getCountries$: Observable<any> | undefined;

  isNewUserSubs: Subscription | undefined;

  constructor(private dialog: MatDialog, private store: Store) { }

  ngOnInit(): void {
    this.isNewUserSubs = this.isNewUser$?.subscribe(value => {
      if (value) {
        this.dialog.open(NewUserDialogComponent, { width: '80%', disableClose: true, hasBackdrop: true} );
      }
    });
  }

  ngOnDestroy() {
    this.isNewUserSubs?.unsubscribe();
  }

  onCountryClick(country:any) {
    this.store.dispatch( new ChangeAppLanguageAction({ values: country }) );
  }

}
