import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BottomBarMobileComponent } from "./bottom-bar-mobile.component";

describe("BottomBarMobileComponent", () => {
  let component: BottomBarMobileComponent;
  let fixture: ComponentFixture<BottomBarMobileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BottomBarMobileComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomBarMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
