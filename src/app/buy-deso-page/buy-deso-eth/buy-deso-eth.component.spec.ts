import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoEthComponent } from './buy-deso-eth.component';

describe('BuyDeSoEthComponent', () => {
  let component: BuyDeSoEthComponent;
  let fixture: ComponentFixture<BuyDeSoEthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoEthComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoEthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
