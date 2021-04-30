import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FollowButtonComponent } from "./follow-button.component";

describe("FollowButtonComponent", () => {
  let component: FollowButtonComponent;
  let fixture: ComponentFixture<FollowButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FollowButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
