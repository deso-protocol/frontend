import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ManageFollowsPageComponent } from "./manage-follows-page.component";

describe("ManageFollowsPageComponent", () => {
  let component: ManageFollowsPageComponent;
  let fixture: ComponentFixture<ManageFollowsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ManageFollowsPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageFollowsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
