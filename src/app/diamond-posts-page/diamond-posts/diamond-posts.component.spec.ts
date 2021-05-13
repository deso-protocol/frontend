import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { DiamondPostsComponent } from "./diamond-posts-page.component";

describe("DiamondPostsPageComponent", () => {
  let component: DiamondPostsComponent;
  let fixture: ComponentFixture<DiamondPostsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiamondPostsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiamondPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
