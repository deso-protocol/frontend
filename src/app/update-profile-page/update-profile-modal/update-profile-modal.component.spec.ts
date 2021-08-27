import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { UpdateProfileModalComponent } from "./update-profile-modal.component";

describe("UpdateProfileComponent", () => {
  let component: UpdateProfileModalComponent;
  let fixture: ComponentFixture<UpdateProfileModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [UpdateProfileModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateProfileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
