import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyCreatorCoinsTutorialPageComponent } from "./buy-creator-coins-tutorial-page.component";

describe("BuyCreatorCoinsTutorialPageComponent", () => {
  let component: BuyCreatorCoinsTutorialPageComponent;
  let fixture: ComponentFixture<BuyCreatorCoinsTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyCreatorCoinsTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyCreatorCoinsTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
