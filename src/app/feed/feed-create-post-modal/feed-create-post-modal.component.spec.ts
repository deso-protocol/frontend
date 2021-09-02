import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedCreatePostModalComponent } from "./feed-create-post-modal.component";

describe("UpdateProfileComponent", () => {
  let component: FeedCreatePostModalComponent;
  let fixture: ComponentFixture<FeedCreatePostModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FeedCreatePostModalComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedCreatePostModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
