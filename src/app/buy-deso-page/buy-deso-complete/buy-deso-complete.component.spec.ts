import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoCompleteComponent } from './buy-deso-complete.component';

describe('BuyDeSoCompleteComponent', () => {
  let component: BuyDeSoCompleteComponent;
  let fixture: ComponentFixture<BuyDeSoCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoCompleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
