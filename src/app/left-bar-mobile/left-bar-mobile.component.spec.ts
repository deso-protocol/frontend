import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { LeftBarMobileComponent } from "./left-bar-mobile.component";

describe("LeftBarMobileComponent", () => {
  let component: LeftBarMobileComponent;
  let fixture: ComponentFixture<LeftBarMobileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LeftBarMobileComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftBarMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
