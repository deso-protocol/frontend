import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CloutCastBarButtonComponent } from "./cloutcast-bar-button.component";

describe("CloutCastBarButtonComponent", () => {
  let component: CloutCastBarButtonComponent;
  let fixture: ComponentFixture<CloutCastBarButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloutCastBarButtonComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloutCastBarButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
