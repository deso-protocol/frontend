import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TopBarMobileHamburgerMenuComponent } from "./top-bar-mobile-hamburger-menu.component";

describe("TopBarHamburgerMenuComponent", () => {
  let component: TopBarMobileHamburgerMenuComponent;
  let fixture: ComponentFixture<TopBarMobileHamburgerMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopBarMobileHamburgerMenuComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBarMobileHamburgerMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
