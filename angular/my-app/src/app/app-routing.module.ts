import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ModulesComponent } from './components/modules/modules.component';
import { ServerDataComponent } from './components/server-data/server-data.component';
import { UserStatsComponent } from './components/user-stats/user-stats.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { Error401Component } from './components/error401/error401.component';
import { AuthGuard } from './guards/auth.guard';
import { UserServerEventTabsComponent } from './components/user-stats/components/user-server-event-tabs/user-server-event-tabs.component';

const routes: Routes = [
  {
    path: 'welcome',
    component: WelcomeComponent,
  },
  {
    path: 'modules',
    component: ModulesComponent, canActivate: [AuthGuard],
  },
  {
    path: 'user-stats',
    component: UserStatsComponent, canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent, canActivate: [AuthGuard]
  },
  {
    path: 'server-data',
    component: ServerDataComponent, canActivate: [AuthGuard]
  },
  {
    path: 'user-server-event-tabs',
    component: UserServerEventTabsComponent, canActivate: [AuthGuard]
  },
  {
    path: 'error401',
    component: Error401Component
  },
  {
    path: 'oauth/redirect',
    redirectTo: '/welcome',
  },
  {
    path: '',
    redirectTo: '/welcome',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
