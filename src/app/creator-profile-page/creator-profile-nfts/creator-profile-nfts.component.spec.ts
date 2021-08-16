import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileNftsComponent } from "./creator-profile-posts.component";

describe("CreatorProfilePostsComponent", () => {
  let component: CreatorProfileNftsComponent;
  let fixture: ComponentFixture<CreatorProfileNftsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorProfileNftsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileNftsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
