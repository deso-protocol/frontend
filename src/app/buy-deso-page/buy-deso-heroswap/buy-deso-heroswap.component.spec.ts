import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoHeroSwapComponent } from './buy-deso-heroswap.component';

describe('BuyDeSoHeroSwapComponent', () => {
  let component: BuyDeSoHeroSwapComponent;
  let fixture: ComponentFixture<BuyDeSoHeroSwapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoHeroSwapComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoHeroSwapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
