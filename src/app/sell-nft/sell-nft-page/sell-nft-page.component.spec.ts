import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SellNftPageComponent } from "./sell-nft-page.component";

describe("PostThreadPageComponent", () => {
  let component: SellNftPageComponent;
  let fixture: ComponentFixture<SellNftPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SellNftPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SellNftPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
