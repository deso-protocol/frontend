import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorCompleteComponent } from "./trade-creator-complete.component";

describe("TradeCreatorCompleteComponent", () => {
  let component: TradeCreatorCompleteComponent;
  let fixture: ComponentFixture<TradeCreatorCompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorCompleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorCompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
