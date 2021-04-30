import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorComponent } from "./trade-creator.component";

describe("TradeCreatorComponent", () => {
  let component: TradeCreatorComponent;
  let fixture: ComponentFixture<TradeCreatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
