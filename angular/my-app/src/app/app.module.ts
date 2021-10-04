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
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Option1Component } from './components/option1/option1.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserHeaderComponent } from './components/user-header/user-header.component';
import { ModulesComponent } from './components/modules/modules.component';
import { MenuComponent } from './components/menu/menu.component';
import { ModuleTableComponent } from './components/modules/module-table/module-table.component';
import { ModuleState } from './states/module.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FilterDialogComponent } from './components/modules/filter-dialog/filter-dialog.component';
import { ShowHideDialogComponent } from './components/modules/show-hide-dialog/show-hide-dialog.component';

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
    Option1Component,
    WelcomeComponent,
    UserHeaderComponent,
    ModulesComponent,
    MenuComponent,
    ModuleTableComponent,
    FilterDialogComponent,
    ShowHideDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      },
      defaultLanguage: 'es'
    }),
    NgxsModule.forRoot([CoreState, ModuleState], ngxsConfig),
    NgxsRouterPluginModule.forRoot(),
    NgxsResetPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(ngxsLoggerConfig),
    NgbModule,
    FontAwesomeModule
  ],
  providers: [
    FilterDialogComponent, 
    ShowHideDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
