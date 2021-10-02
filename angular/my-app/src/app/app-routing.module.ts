import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModulesComponent } from './components/modules/modules.component';
import { Option1Component } from './components/option1/option1.component';
import { Option2Component } from './components/option2/option2.component';
import { WelcomeComponent } from './components/welcome/welcome.component';

const routes: Routes = [
  {
    path: 'option1',
    component: Option1Component,
  },
  {
    path: 'option2',
    component: Option2Component,
  },
  {
    path: 'modules',
    component: ModulesComponent,
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
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
