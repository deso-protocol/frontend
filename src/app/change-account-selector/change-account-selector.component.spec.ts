import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeAccountSelectorComponent } from './change-account-selector.component';

describe('ChangeAccountSelectorComponent', () => {
  let component: ChangeAccountSelectorComponent;
  let fixture: ComponentFixture<ChangeAccountSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChangeAccountSelectorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeAccountSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
