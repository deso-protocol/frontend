import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { MintNftPageComponent } from "./mint-nft-page.component";

describe("PostThreadPageComponent", () => {
  let component: MintNftPageComponent;
  let fixture: ComponentFixture<MintNftPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MintNftPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MintNftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
