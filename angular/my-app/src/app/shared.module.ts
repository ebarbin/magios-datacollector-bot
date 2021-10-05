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
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
@NgModule({
    declarations: [],
    imports: [ 
        CommonModule,
        FormsModule,
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
        MatToolbarModule,
        MatIconModule,
        MatButtonModule,
        MatSidenavModule,
        MatTableModule,
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
        FontAwesomeModule
    ]
})
export class SharedModule { }