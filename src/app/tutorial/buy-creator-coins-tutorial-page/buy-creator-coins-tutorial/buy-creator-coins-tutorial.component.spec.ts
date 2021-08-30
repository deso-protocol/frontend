import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BuyCreatorCoinsTutorialComponent } from "./buy-creator-coins-tutorial.component";

describe("BuyCreatorCoinsTutorialComponent", () => {
  let component: BuyCreatorCoinsTutorialComponent;
  let fixture: ComponentFixture<BuyCreatorCoinsTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BuyCreatorCoinsTutorialComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyCreatorCoinsTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
