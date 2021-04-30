import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { UpdateProfilePageComponent } from "./update-profile-page.component";

describe("UpdateProfilePageComponent", () => {
  let component: UpdateProfilePageComponent;
  let fixture: ComponentFixture<UpdateProfilePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateProfilePageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
