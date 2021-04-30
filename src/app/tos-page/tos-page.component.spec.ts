import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TosPageComponent } from "./tos-page.component";

describe("TosPageComponent", () => {
  let component: TosPageComponent;
  let fixture: ComponentFixture<TosPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TosPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
