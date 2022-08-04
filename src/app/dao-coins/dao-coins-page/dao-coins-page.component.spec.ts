import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DaoCoinsPageComponent } from './wallet-page.component';

describe('WalletPageComponent', () => {
  let component: DaoCoinsPageComponent;
  let fixture: ComponentFixture<DaoCoinsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DaoCoinsPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaoCoinsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
