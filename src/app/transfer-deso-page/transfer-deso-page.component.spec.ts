import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TransferDeSoPageComponent } from "./transfer-deso-page.component";

describe("TransferDeSoPageComponent", () => {
  let component: TransferDeSoPageComponent;
  let fixture: ComponentFixture<TransferDeSoPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TransferDeSoPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferDeSoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
