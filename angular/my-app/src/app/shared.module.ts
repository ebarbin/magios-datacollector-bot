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
import { MatExpansionModule } from '@angular/material/expansion';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { RoleComponent } from './components/role/role.component';
import { RolePipe } from './pipes/role.pipe';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSortModule } from '@angular/material/sort';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DateAdapter as CoreDateAdapter, MAT_DATE_FORMATS as CORE_MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { GlobalHttpInterceptor } from './interceptors/global-http.interceptor';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { OrderModule } from 'ngx-order-pipe';

export const MOMENTJS_DATE_FORMAT = {
  parse: {
      dateInput: 'DD.MM.YYYY',
  },
  display: {
      dateInput: 'DD/MM/YYYY',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'DD/MM/YYYY',
      monthYearA11yLabel: 'MMMM YYYY',
  },
};

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
        NgxChartsModule,
        MatSidenavModule,
        MatTableModule,
        MatListModule,
        MatCardModule,
        MatSlideToggleModule,
        MatExpansionModule,
        MatDatepickerModule,
        MatSelectModule,
        MatBadgeModule,
        FontAwesomeModule,
        MatDialogModule,
        MatCheckboxModule,
        MatGridListModule,
        MatDividerModule,
        MatInputModule,
        MatSortModule,
        MatTabsModule,
        OrderModule,
        MatStepperModule,
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
        NgxChartsModule,
        MatTableModule,
        MatInputModule,
        MatSortModule,
        MatStepperModule,
        MatListModule,
        MatGridListModule,
        MatCardModule,
        MatExpansionModule,
        MatSlideToggleModule,
        MatDialogModule,
        MatDividerModule,
        MatBadgeModule,
        MatTabsModule,
        OrderModule,
        MatSelectModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        BlockUIModule,
        MatCheckboxModule,
        ToastrModule,
        FontAwesomeModule,
        RoleComponent,
        RolePipe
    ],
    providers: [
      { provide: HTTP_INTERCEPTORS, useClass: GlobalHttpInterceptor, multi: true  },
      { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
      { provide: CoreDateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: CORE_MAT_DATE_FORMATS, useValue: MOMENTJS_DATE_FORMAT},
    ]
})
export class SharedModule { }