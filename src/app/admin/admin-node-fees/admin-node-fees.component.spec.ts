import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNodeFeesComponent } from './admin-node-fees.component';

describe('AdminNodeFeesComponent', () => {
  let component: AdminNodeFeesComponent;
  let fixture: ComponentFixture<AdminNodeFeesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminNodeFeesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminNodeFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
