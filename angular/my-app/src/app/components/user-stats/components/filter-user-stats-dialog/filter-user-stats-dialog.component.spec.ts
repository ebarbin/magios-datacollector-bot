import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterUserStatsDialogComponent } from './filter-user-stats-dialog.component';

describe('FilterUserStatsDialogComponent', () => {
  let component: FilterUserStatsDialogComponent;
  let fixture: ComponentFixture<FilterUserStatsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterUserStatsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterUserStatsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
