import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ModulesComponent } from './components/modules/modules.component';
import { UserStatsComponent } from './components/user-stats/user-stats.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { AuthGuard } from './guards/auth.guard';

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
