import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorLoggedOutComponent } from "./trade-creator-logged-out.component";

describe("TradeCreatorLoggedOutComponent", () => {
  let component: TradeCreatorLoggedOutComponent;
  let fixture: ComponentFixture<TradeCreatorLoggedOutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorLoggedOutComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorLoggedOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
