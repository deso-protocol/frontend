import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { TradeCreatorFormComponent } from "./trade-creator-form.component";

describe("TradeCreatorFormComponent", () => {
  let component: TradeCreatorFormComponent;
  let fixture: ComponentFixture<TradeCreatorFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TradeCreatorFormComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TradeCreatorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
