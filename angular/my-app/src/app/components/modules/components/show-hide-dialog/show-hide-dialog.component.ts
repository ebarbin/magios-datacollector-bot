import { Component, OnDestroy, OnInit } from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import { TranslateService } from "@ngx-translate/core";
import { ModuleState } from 'src/app/states/module.state';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { ShowHideModulesAction } from 'src/app/actions/module.action';

export interface Task {
  id: number,
  name: string;
  completed: boolean;
  color: ThemePalette;
  values?: Task[];
  allComplete: boolean,
}

@Component({
  selector: 'app-show-hide-dialog',
  templateUrl: './show-hide-dialog.component.html',
  styleUrls: ['./show-hide-dialog.component.scss']
})
export class ShowHideDialogComponent implements OnInit, OnDestroy {

  @Select(ModuleState.getModules) getModules$: Observable<any> | undefined;
  getModulesSubs: Subscription | undefined;

  constructor(private store: Store, private dialogRef: MatDialogRef<ShowHideDialogComponent>, private translate: TranslateService) { }

  categories:Task[] = [];

  ngOnInit(): void {
    this.getModulesSubs = this.getModules$?.subscribe(module => {

      const terrains: Task = {id: 0, completed: true, allComplete: true, color: 'primary', name: this.translate.instant('Terrains'), values: module.terrains.map((t:any, index: number) => { return {id: index, name: t.name, completed: t.visible, color: 'primary'} })};
      this.updateAllComplete(terrains);
      const jets: Task = {id: 1, completed: true, allComplete: true, color: 'primary', name: this.translate.instant('Jets'), values: module.jets.map((t:any, index: number ) => { return {id: index, name: t.name, completed: t.visible, color: 'primary'} })};
      this.updateAllComplete(jets);
      const warbirds: Task = {id: 2, completed: true, allComplete: true, color: 'primary', name: this.translate.instant('Warbirds'), values: module.warbirds.map((t:any, index: number) => { return {id: index, name: t.name, completed: t.visible, color: 'primary'} }) };
      this.updateAllComplete(warbirds);
      const helis: Task = {id: 3, completed: true, allComplete: true, color: 'primary', name: this.translate.instant('Helis'), values: module.helis.map((t:any, index: number) => { return {id: index, name: t.name, completed: t.visible, color: 'primary'} })};
      this.updateAllComplete(helis);
      const others: Task = {id: 4, completed: true, allComplete: true, color: 'primary', name: this.translate.instant('Others'), values: module.others.map((t:any, index: number) => { return {id: index, name: t.name, completed: t.visible, color: 'primary'} })};
      this.updateAllComplete(others);

      this.categories.push(terrains);
      this.categories.push(jets);
      this.categories.push(warbirds);
      this.categories.push(helis);
      this.categories.push(others);
    })
  }

  ngOnDestroy() {
    this.getModulesSubs?.unsubscribe();
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

  onAccept() {
    this.store.dispatch(new ShowHideModulesAction({categories: this.categories}));
    this.dialogRef.close();
  }
}
