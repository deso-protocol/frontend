import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorPageComponent } from "./trade-creator-page.component";

describe("TradeCreatorPageComponent", () => {
  let component: TradeCreatorPageComponent;
  let fixture: ComponentFixture<TradeCreatorPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
