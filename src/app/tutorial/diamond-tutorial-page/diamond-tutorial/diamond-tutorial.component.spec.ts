import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DiamondTutorialComponent } from "./diamond-tutorial.component";

describe("BuyCreatorCoinsTutorialComponent", () => {
  let component: DiamondTutorialComponent;
  let fixture: ComponentFixture<DiamondTutorialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiamondTutorialComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiamondTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
