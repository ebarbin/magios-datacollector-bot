import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './shared.module';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsModule, NgxsModuleOptions } from '@ngxs/store';
import { environment } from 'src/environments/environment';
import { NgxsResetPluginModule } from 'ngxs-reset-plugin';
import { CoreState } from './states/core.state';
import { UserStatsState } from './states/user-stats.state';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { ModulesComponent } from './components/modules/modules.component';
import { MenuComponent } from './components/menu/menu.component';
import { ModuleTableComponent } from './components/modules/components/module-table/module-table.component';
import { ModuleState } from './states/module.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilterDialogComponent } from './components/modules/components/filter-dialog/filter-dialog.component';
import { ShowHideDialogComponent } from './components/modules/components/show-hide-dialog/show-hide-dialog.component';
import { UserStatsComponent } from './components/user-stats/user-stats.component';
import { UserStatsTableComponent } from './components/user-stats/components/user-stats-table/user-stats-table.component';
import { MomentModule } from 'ngx-moment';
import { ValueChangeDialogComponent } from './components/user-stats/components/value-change-dialog/value-change-dialog.component';
import { NewUserDialogComponent } from './components/welcome/components/new-user-dialog/new-user-dialog.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CountryChartComponent } from './components/dashboard/components/country-chart/country-chart.component';
import { FilterUserStatsDialogComponent } from './components/user-stats/components/filter-user-stats-dialog/filter-user-stats-dialog.component';
import { DashboardState } from './states/dashboard.state';
import { ServerDataComponent } from './components/server-data/server-data.component';
import { ServerDataState } from './states/server-data.state';
import { ServerFormComponent } from './components/server-data/components/server-form/server-form.component';
import { KillerChartComponent } from './components/dashboard/components/killer-chart/killer-chart.component';
import { AccuracyChartComponent } from './components/dashboard/components/accuracy-chart/accuracy-chart.component';
import { DeadChartComponent } from './components/dashboard/components/dead-chart/dead-chart.component';
import { CrashChartComponent } from './components/dashboard/components/crash-chart/crash-chart.component';
import { Error401Component } from './components/error401/error401.component';
import { UserServerEventTabsComponent } from './components/user-stats/components/user-server-event-tabs/user-server-event-tabs.component';
import { UserEventsServerComponent } from './components/user-stats/components/user-events-server/user-events-server.component';
import { HeaderEventDatePipe } from './pipes/header-event-date.pipe';
import { EventDatePipe } from './pipes/event-date.pipe';
import { EventTypeComponent } from './components/user-stats/components/event-type/event-type.component';
import { ServerEventsComponent } from './components/user-stats/components/server-events/server-events.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TaskState } from './states/task.state';
import { TaskItemComponent } from './components/tasks/components/task-item/task-item.component';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const ngxsConfig: NgxsModuleOptions = {
  developmentMode: !environment.production,
  selectorOptions: {
    suppressErrors: false,
    injectContainerState: false,
  },
  compatibility: {
    strictContentSecurityPolicy: true,
  },
}

export const ngxsLoggerConfig = {
  disabled: environment.production,
  collapsed: true,
}

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    UserHeaderComponent,
    ModulesComponent,
    MenuComponent,
    ModuleTableComponent,
    FilterDialogComponent,
    ShowHideDialogComponent,
    UserStatsComponent,
    UserStatsTableComponent,
    ValueChangeDialogComponent,
    NewUserDialogComponent,
    DashboardComponent,
    CountryChartComponent,
    FilterUserStatsDialogComponent,
    ServerDataComponent,
    ServerFormComponent,
    KillerChartComponent,
    AccuracyChartComponent,
    DeadChartComponent,
    CrashChartComponent,
    Error401Component,
    UserServerEventTabsComponent,
    UserEventsServerComponent,
    HeaderEventDatePipe,
    EventDatePipe,
    EventTypeComponent,
    ServerEventsComponent,
    TasksComponent,
    TaskItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    MomentModule.forRoot({
      relativeTimeThresholdOptions: {
        'm': 59
      }
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      },
      defaultLanguage: 'es'
    }),
    NgxsModule.forRoot([CoreState, ModuleState, UserStatsState, DashboardState, ServerDataState, TaskState], ngxsConfig),
    NgxsRouterPluginModule.forRoot(),
    NgxsResetPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(ngxsLoggerConfig),
    NgbModule,
    FontAwesomeModule
  ],
  providers: [
    FilterDialogComponent, 
    FilterUserStatsDialogComponent,
    ShowHideDialogComponent,
    ValueChangeDialogComponent,
    NewUserDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
