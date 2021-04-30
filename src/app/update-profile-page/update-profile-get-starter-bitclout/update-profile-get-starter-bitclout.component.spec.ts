import { ComponentFixture, TestBed } from "@angular/core/testing";

import { UpdateProfileGetStarterBitcloutComponent } from "./update-profile-get-starter-bitclout.component";

describe("UpdateProfileGetStarterBitcloutComponent", () => {
  let component: UpdateProfileGetStarterBitcloutComponent;
  let fixture: ComponentFixture<UpdateProfileGetStarterBitcloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateProfileGetStarterBitcloutComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateProfileGetStarterBitcloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
