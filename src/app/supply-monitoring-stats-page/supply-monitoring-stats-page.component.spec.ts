import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SupplyMonitoringStatsPageComponent } from "./supply-monitoring-stats-page.component";

describe("SupplyMonitoringStatsPageComponent", () => {
  let component: SupplyMonitoringStatsPageComponent;
  let fixture: ComponentFixture<SupplyMonitoringStatsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SupplyMonitoringStatsPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplyMonitoringStatsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
