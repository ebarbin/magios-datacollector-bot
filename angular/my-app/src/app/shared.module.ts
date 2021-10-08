import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { BlockUIModule } from 'ng-block-ui';
import { ToastrModule } from 'ngx-toastr';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

import { RoleComponent } from './components/role/role.component';
import { RolePipe } from './pipes/role.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSortModule } from '@angular/material/sort';

@NgModule({
    declarations: [
    RoleComponent,
    RolePipe
  ],
    imports: [ 
        CommonModule,
        FormsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatTableModule,
        MatSlideToggleModule,
        MatSelectModule,
        MatBadgeModule,
        FontAwesomeModule,
        MatDialogModule,
        MatCheckboxModule,
        MatDividerModule,
        MatInputModule,
        MatSortModule,
        MatAutocompleteModule,
        BlockUIModule.forRoot(),
        ToastrModule.forRoot({
          timeOut: 1500,
          newestOnTop: true,
          maxOpened: 1,
          autoDismiss: true,
          positionClass: 'toast-top-right',
        })
    ],
    exports:[
        FormsModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatSidenavModule,
        MatTableModule,
        MatInputModule,
        MatSortModule,
        MatListModule,
        MatSlideToggleModule,
        MatDialogModule,
        MatDividerModule,
        MatBadgeModule,
        MatSelectModule,
        MatAutocompleteModule,
        BlockUIModule,
        MatCheckboxModule,
        ToastrModule,
        FontAwesomeModule,
        RoleComponent,
        RolePipe
    ]
})
export class SharedModule { }