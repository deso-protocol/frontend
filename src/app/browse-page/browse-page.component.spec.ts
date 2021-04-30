import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { BrowsePageComponent } from "./browse-page.component";

describe("BrowseComponent", () => {
  let component: BrowsePageComponent;
  let fixture: ComponentFixture<BrowsePageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BrowsePageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowsePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
