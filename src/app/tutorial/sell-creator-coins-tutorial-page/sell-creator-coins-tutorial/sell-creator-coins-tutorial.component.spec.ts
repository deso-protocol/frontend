import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SellCreatorCoinsTutorialComponent } from "./sell-creator-coins-tutorial.component";

describe("SellCreatorCoinsTutorialComponent", () => {
  let component: SellCreatorCoinsTutorialComponent;
  let fixture: ComponentFixture<SellCreatorCoinsTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SellCreatorCoinsTutorialComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SellCreatorCoinsTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
