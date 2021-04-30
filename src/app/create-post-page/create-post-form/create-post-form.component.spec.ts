import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatePostFormComponent } from "./create-post-form.component";

describe("CreatePostFormComponent", () => {
  let component: CreatePostFormComponent;
  let fixture: ComponentFixture<CreatePostFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatePostFormComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
