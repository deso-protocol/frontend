import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TopBarMobileLogInOrSignUpComponent } from "./top-bar-mobile-log-in-or-sign-up.component";

describe("TopBarMobileLogInOrSignUpComponent", () => {
  let component: TopBarMobileLogInOrSignUpComponent;
  let fixture: ComponentFixture<TopBarMobileLogInOrSignUpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopBarMobileLogInOrSignUpComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBarMobileLogInOrSignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
