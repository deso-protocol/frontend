import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoMegaSwapComponent } from './buy-deso-megaswap.component';

describe('BuyDeSoMegaSwapComponent', () => {
  let component: BuyDeSoMegaSwapComponent;
  let fixture: ComponentFixture<BuyDeSoMegaSwapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoMegaSwapComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoMegaSwapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
