import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { ManageFollowsComponent } from "./manage-follows.component";

describe("ManageFollowsComponent", () => {
  let component: ManageFollowsComponent;
  let fixture: ComponentFixture<ManageFollowsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ManageFollowsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageFollowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
