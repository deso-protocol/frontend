import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { LeftBarComponent } from "./left-bar.component";

describe("LeftBarComponent", () => {
  let component: LeftBarComponent;
  let fixture: ComponentFixture<LeftBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LeftBarComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeftBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
