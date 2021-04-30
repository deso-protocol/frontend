import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorPreviewComponent } from "./trade-creator-preview.component";

describe("TradeCreatorPreviewComponent", () => {
  let component: TradeCreatorPreviewComponent;
  let fixture: ComponentFixture<TradeCreatorPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorPreviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
