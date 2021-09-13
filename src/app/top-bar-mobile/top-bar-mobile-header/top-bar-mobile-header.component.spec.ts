import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TopBarMobileHeaderComponent } from "./top-bar-mobile-header.component";

describe("TopBarHeaderMenuComponent", () => {
  let component: TopBarMobileHeaderComponent;
  let fixture: ComponentFixture<TopBarMobileHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TopBarMobileHeaderComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBarMobileHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
