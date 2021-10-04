import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TransferDeSoComponent } from "./transfer-deso.component";

describe("TransferDeSoComponent", () => {
  let component: TransferDeSoComponent;
  let fixture: ComponentFixture<TransferDeSoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TransferDeSoComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferDeSoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
