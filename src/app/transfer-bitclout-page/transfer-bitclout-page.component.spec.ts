import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TransferBitcloutPageComponent } from "./transfer-bitclout-page.component";

describe("TransferBitcloutPageComponent", () => {
  let component: TransferBitcloutPageComponent;
  let fixture: ComponentFixture<TransferBitcloutPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TransferBitcloutPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferBitcloutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
