import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyCreatorCoinsConfirmTutorialComponent } from "./buy-creator-coins-confirm-tutorial.component";

describe("BuyCreatorCoinsConfirmTutorialComponent", () => {
  let component: BuyCreatorCoinsConfirmTutorialComponent;
  let fixture: ComponentFixture<BuyCreatorCoinsConfirmTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyCreatorCoinsConfirmTutorialComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyCreatorCoinsConfirmTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
