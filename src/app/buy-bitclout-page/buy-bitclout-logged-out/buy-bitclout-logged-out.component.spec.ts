import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyBitcloutLoggedOutComponent } from "./buy-bitclout-logged-out.component";

describe("BuyBitcloutLoggedOutComponent", () => {
  let component: BuyBitcloutLoggedOutComponent;
  let fixture: ComponentFixture<BuyBitcloutLoggedOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyBitcloutLoggedOutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyBitcloutLoggedOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
