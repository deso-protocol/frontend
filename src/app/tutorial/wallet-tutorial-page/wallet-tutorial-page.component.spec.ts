import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { WalletTutorialPageComponent } from "./wallet-tutorial-page.component";

describe("WalletPageComponent", () => {
  let component: WalletTutorialPageComponent;
  let fixture: ComponentFixture<WalletTutorialPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WalletTutorialPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletTutorialPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
