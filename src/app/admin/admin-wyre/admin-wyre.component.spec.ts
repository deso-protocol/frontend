import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminWyreComponent } from "./admin-wyre.component";

describe("AdminWyreComponent", () => {
  let component: AdminWyreComponent;
  let fixture: ComponentFixture<AdminWyreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminWyreComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminWyreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
