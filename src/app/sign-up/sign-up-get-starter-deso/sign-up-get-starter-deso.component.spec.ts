import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SignUpGetStarterDeSoComponent } from "./sign-up-get-starter-deso.component";

describe("SignUpGetStarterDeSoComponent", () => {
  let component: SignUpGetStarterDeSoComponent;
  let fixture: ComponentFixture<SignUpGetStarterDeSoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignUpGetStarterDeSoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignUpGetStarterDeSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
