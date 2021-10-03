import { Component, OnInit } from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import { TranslateService } from "@ngx-translate/core";
import { ModuleState } from 'src/app/states/module.state';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';

export interface Task {
  name: string;
  completed: boolean;
  color: ThemePalette;
  values?: Task[];
  allComplete: boolean
}

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss']
})
export class FilterDialogComponent implements OnInit {

  @Select(ModuleState.getModules) getModules$: Observable<any> | undefined;
  
  constructor(private translate: TranslateService) { }

  categories:Task[] = [];

  ngOnInit(): void {
    this.getModules$?.subscribe(module => {

      const terrains: Task = {completed: false, allComplete: false, color: 'primary', name: this.translate.instant('Terrains'), values: module.terrains.map((t:any) => { return {name: t, completed: false, color: 'primary'} })};
      const jets: Task = {completed: false, allComplete: false, color: 'primary', name: this.translate.instant('Jets'), values: module.jets.map((t:any) => { return {name: t, completed: false, color: 'primary'} })};
      const warbirds: Task = {completed: false, allComplete: false, color: 'primary', name: this.translate.instant('Warbirds'), values: module.warbirds.map((t:any) => { return {name: t, completed: false, color: 'primary'} }) };
      const helis: Task = {completed: false, allComplete: false, color: 'primary', name: this.translate.instant('Helis'), values: module.helis.map((t:any) => { return {name: t, completed: false, color: 'primary'} })};
      const others: Task = {completed: false, allComplete: false, color: 'primary', name: this.translate.instant('Others'), values: module.others.map((t:any) => { return {name: t, completed: false, color: 'primary'} })};

      this.categories.push(terrains);
      this.categories.push(jets);
      this.categories.push(warbirds);
      this.categories.push(helis);
      this.categories.push(others);
    })
  }

  updateAllComplete(elem: any) {
    elem.allComplete = elem?.values != null && elem.values.every((t:any) => t.completed);
  }

  someComplete(elem: any): boolean {
    if (elem?.values == null) {
      return false;
    }
    return elem?.values.filter((t:any) => t.completed).length > 0 && !elem.allComplete;
  }

  setAll(completed: boolean, elem: any) {
    elem.allComplete = completed;
    if (elem?.values == null) {
      return;
    }
    elem?.values.forEach((t:any) => t.completed = completed);
  }
}
