import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TrendsPageComponent } from "./trends-page.component";

describe("TrendsPageComponent", () => {
  let component: TrendsPageComponent;
  let fixture: ComponentFixture<TrendsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TrendsPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrendsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
