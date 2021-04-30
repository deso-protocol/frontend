import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedPostIconRowComponent } from "./feed-post-icon-row.component";

describe("FeedPostIconRowComponent", () => {
  let component: FeedPostIconRowComponent;
  let fixture: ComponentFixture<FeedPostIconRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeedPostIconRowComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedPostIconRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
