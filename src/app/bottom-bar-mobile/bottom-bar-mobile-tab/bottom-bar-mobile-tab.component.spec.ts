import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BottomBarMobileTabComponent } from "./bottom-bar-mobile-tab.component";

describe("BottomBarMobileTabComponent", () => {
  let component: BottomBarMobileTabComponent;
  let fixture: ComponentFixture<BottomBarMobileTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BottomBarMobileTabComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BottomBarMobileTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
