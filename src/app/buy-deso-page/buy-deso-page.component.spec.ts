import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyDeSoPageComponent } from './buy-deso-page.component';

describe('BuyDeSoPageComponent', () => {
  let component: BuyDeSoPageComponent;
  let fixture: ComponentFixture<BuyDeSoPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyDeSoPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyDeSoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
