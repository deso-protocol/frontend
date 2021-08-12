import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SellCreatorCoinsTutorialPageComponent } from "./buy-creator-coins-tutorial-page.component";

describe("BuyCreatorCoinsTutorialPageComponent", () => {
  let component: SellCreatorCoinsTutorialPageComponent;
  let fixture: ComponentFixture<SellCreatorCoinsTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SellCreatorCoinsTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SellCreatorCoinsTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
