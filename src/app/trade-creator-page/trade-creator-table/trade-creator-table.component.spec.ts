import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorTableComponent } from "./trade-creator-table.component";

describe("TradeCreatorTableComponent", () => {
  let component: TradeCreatorTableComponent;
  let fixture: ComponentFixture<TradeCreatorTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorTableComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
