import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileTopCardComponent } from "./creator-profile-top-card.component";

describe("CreatorProfileTopCardComponent", () => {
  let component: CreatorProfileTopCardComponent;
  let fixture: ComponentFixture<CreatorProfileTopCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfileTopCardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileTopCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
