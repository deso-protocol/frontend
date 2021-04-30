import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfilePageComponent } from "./creator-profile-page.component";

describe("CreatorProfilePageComponent", () => {
  let component: CreatorProfilePageComponent;
  let fixture: ComponentFixture<CreatorProfilePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfilePageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
