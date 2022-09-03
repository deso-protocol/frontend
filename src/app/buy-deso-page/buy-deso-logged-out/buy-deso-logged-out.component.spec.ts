import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoLoggedOutComponent } from './buy-deso-logged-out.component';

describe('BuyDeSoLoggedOutComponent', () => {
  let component: BuyDeSoLoggedOutComponent;
  let fixture: ComponentFixture<BuyDeSoLoggedOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoLoggedOutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoLoggedOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
