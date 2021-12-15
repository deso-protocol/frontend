import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SupplyMonitoringStatsComponent } from "./supply-monitoring-stats.component";

describe("SupplyMonitoringStatsComponent", () => {
  let component: SupplyMonitoringStatsComponent;
  let fixture: ComponentFixture<SupplyMonitoringStatsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SupplyMonitoringStatsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupplyMonitoringStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
