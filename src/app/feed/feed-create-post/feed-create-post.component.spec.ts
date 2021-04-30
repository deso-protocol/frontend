import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedCreatePostComponent } from "./feed-create-post.component";

describe("FeedCreatePostComponent", () => {
  let component: FeedCreatePostComponent;
  let fixture: ComponentFixture<FeedCreatePostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeedCreatePostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedCreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
