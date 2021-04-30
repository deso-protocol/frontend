import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RightBarCreatorsComponent } from "./right-bar-creators.component";

describe("RightBarCreatorsComponent", () => {
  let component: RightBarCreatorsComponent;
  let fixture: ComponentFixture<RightBarCreatorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RightBarCreatorsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightBarCreatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
