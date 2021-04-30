import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FeedPostImageModalComponent } from "./feed-post-image-modal.component";

describe("FeedPostImageModalComponent", () => {
  let component: FeedPostImageModalComponent;
  let fixture: ComponentFixture<FeedPostImageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedPostImageModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedPostImageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
