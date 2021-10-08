import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModulesComponent } from './components/modules/modules.component';
import { UserStatsComponent } from './components/user-stats/user-stats.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'modules',
    component: ModulesComponent, canActivate: [AuthGuard],
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
  },
  {
    path: 'userStats',
    component: UserStatsComponent,
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
