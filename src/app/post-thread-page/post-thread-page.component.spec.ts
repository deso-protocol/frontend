import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { PostThreadPageComponent } from "./post-thread-page.component";

describe("PostThreadPageComponent", () => {
  let component: PostThreadPageComponent;
  let fixture: ComponentFixture<PostThreadPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PostThreadPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostThreadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
