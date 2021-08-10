import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { AdminJumioComponent } from "./admin-jumio.component";

describe("AdminJumioComponent", () => {
  let component: AdminJumioComponent;
  let fixture: ComponentFixture<AdminJumioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AdminJumioComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminJumioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
