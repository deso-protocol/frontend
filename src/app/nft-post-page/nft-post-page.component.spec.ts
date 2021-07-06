import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { NftPostPageComponent } from "./nft-post-page.component";

describe("NftPostPageComponent", () => {
  let component: NftPostPageComponent;
  let fixture: ComponentFixture<NftPostPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NftPostPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NftPostPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
