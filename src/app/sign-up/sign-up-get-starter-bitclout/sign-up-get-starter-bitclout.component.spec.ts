import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SignUpGetStarterBitcloutComponent } from "./sign-up-get-starter-bitclout.component";

describe("SignUpGetStarterBitcloutComponent", () => {
  let component: SignUpGetStarterBitcloutComponent;
  let fixture: ComponentFixture<SignUpGetStarterBitcloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignUpGetStarterBitcloutComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignUpGetStarterBitcloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
