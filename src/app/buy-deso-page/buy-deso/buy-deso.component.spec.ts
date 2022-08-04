import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoComponent } from './buy-deso.component';

describe('BuyDeSoComponent', () => {
  let component: BuyDeSoComponent;
  let fixture: ComponentFixture<BuyDeSoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
