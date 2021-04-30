import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileDetailsComponent } from "./creator-profile-details.component";

describe("CreatorProfileDetailsComponent", () => {
  let component: CreatorProfileDetailsComponent;
  let fixture: ComponentFixture<CreatorProfileDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfileDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
