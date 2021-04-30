import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyBitcloutPageComponent } from "./buy-bitclout-page.component";

describe("BuyBitcloutPageComponent", () => {
  let component: BuyBitcloutPageComponent;
  let fixture: ComponentFixture<BuyBitcloutPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyBitcloutPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyBitcloutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
