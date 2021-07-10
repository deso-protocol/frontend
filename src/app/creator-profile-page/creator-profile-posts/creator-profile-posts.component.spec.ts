import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CreatorProfilePostsComponent } from "./creator-profile-posts.component";

describe("CreatorProfilePostsComponent", () => {
  let component: CreatorProfilePostsComponent;
  let fixture: ComponentFixture<CreatorProfilePostsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfilePostsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfilePostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
