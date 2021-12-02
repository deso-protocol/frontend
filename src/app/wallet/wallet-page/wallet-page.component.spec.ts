import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { WalletPageComponent } from "./wallet-page.component";

describe("WalletPageComponent", () => {
  let component: WalletPageComponent;
  let fixture: ComponentFixture<WalletPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WalletPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
