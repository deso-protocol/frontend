import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DiamondTutorialPageComponent } from "./diamond-tutorial-page.component";

describe("DiamondTutorialPageComponent", () => {
  let component: DiamondTutorialPageComponent;
  let fixture: ComponentFixture<DiamondTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiamondTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiamondTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
