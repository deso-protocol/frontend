import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatePostTutorialPageComponent } from "./create-post-tutorial-page.component";

describe("CreatePostTutorialPageComponent", () => {
  let component: CreatePostTutorialPageComponent;
  let fixture: ComponentFixture<CreatePostTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePostTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
