import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyBitcloutUSDComponent } from "./buy-bitclout-usd.component";

describe("BuyBitcloutUSDComponent", () => {
  let component: BuyBitcloutUSDComponent;
  let fixture: ComponentFixture<BuyBitcloutUSDComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyBitcloutUSDComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyBitcloutUSDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
