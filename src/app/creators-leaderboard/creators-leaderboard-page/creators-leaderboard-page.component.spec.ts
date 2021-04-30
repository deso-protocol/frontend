import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorsLeaderboardPageComponent } from "./creators-leaderboard-page.component";

describe("CreatorsLeaderboardPageComponent", () => {
  let component: CreatorsLeaderboardPageComponent;
  let fixture: ComponentFixture<CreatorsLeaderboardPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorsLeaderboardPageComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorsLeaderboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
