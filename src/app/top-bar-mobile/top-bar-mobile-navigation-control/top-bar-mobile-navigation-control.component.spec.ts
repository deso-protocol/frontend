import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TopBarMobileNavigationControlComponent } from "./top-bar-mobile-navigation-control.component";

describe("TopBarMobileNavigationControlComponent", () => {
  let component: TopBarMobileNavigationControlComponent;
  let fixture: ComponentFixture<TopBarMobileNavigationControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopBarMobileNavigationControlComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBarMobileNavigationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
