import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CoreState } from 'src/app/states/core.state';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-user-header',
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.scss']
})
export class UserHeaderComponent implements OnInit {

  @Select(CoreState.isNewUser) isNewUser$: Observable<any> | undefined;
  faQuestion = faQuestion;
  
  @Select(CoreState.getUser) getUser$: Observable<any> | undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
