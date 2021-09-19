import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyBitcloutComponent } from "./buy-bitclout.component";

describe("BuyBitcloutComponent", () => {
  let component: BuyBitcloutComponent;
  let fixture: ComponentFixture<BuyBitcloutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyBitcloutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyBitcloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
