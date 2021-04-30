import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileHodlersComponent } from "./creator-profile-hodlers.component";

describe("CreatorProfileHodlersComponent", () => {
  let component: CreatorProfileHodlersComponent;
  let fixture: ComponentFixture<CreatorProfileHodlersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfileHodlersComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileHodlersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
