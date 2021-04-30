import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyBitcloutCompleteComponent } from "./buy-bitclout-complete.component";

describe("BuyBitcloutCompleteComponent", () => {
  let component: BuyBitcloutCompleteComponent;
  let fixture: ComponentFixture<BuyBitcloutCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyBitcloutCompleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyBitcloutCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
