import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreateProfileTutorialPageComponent } from "./create-profile-tutorial-page.component";

describe("CreateProfileTutorialPageComponent", () => {
  let component: CreateProfileTutorialPageComponent;
  let fixture: ComponentFixture<CreateProfileTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateProfileTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProfileTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
