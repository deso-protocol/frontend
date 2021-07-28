import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { NftPostComponent } from "./nft-post.component";

describe("NftPostComponent", () => {
  let component: NftPostComponent;
  let fixture: ComponentFixture<NftPostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NftPostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NftPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
