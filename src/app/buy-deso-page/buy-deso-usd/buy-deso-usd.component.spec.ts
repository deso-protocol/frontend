import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoUSDComponent } from './buy-deso-usd.component';

describe('BuyDeSoUSDComponent', () => {
  let component: BuyDeSoUSDComponent;
  let fixture: ComponentFixture<BuyDeSoUSDComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoUSDComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoUSDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
