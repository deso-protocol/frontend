import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { JumioStatusComponent } from "./jumio-status.component";

describe("JumioStatusComponent", () => {
  let component: JumioStatusComponent;
  let fixture: ComponentFixture<JumioStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JumioStatusComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JumioStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
