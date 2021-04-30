import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RightBarSignupComponent } from "./right-bar-signup.component";

describe("RightBarSignupComponent", () => {
  let component: RightBarSignupComponent;
  let fixture: ComponentFixture<RightBarSignupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RightBarSignupComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightBarSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
