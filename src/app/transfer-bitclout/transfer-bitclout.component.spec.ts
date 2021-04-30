import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TransferBitcloutComponent } from "./transfer-bitclout.component";

describe("TransferBitcloutComponent", () => {
  let component: TransferBitcloutComponent;
  let fixture: ComponentFixture<TransferBitcloutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TransferBitcloutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferBitcloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
