import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { RightBarCreatorsLeaderboardComponent } from "./right-bar-creators-leaderboard.component";

describe("RightBarCreatorsLeaderboardComponent", () => {
  let component: RightBarCreatorsLeaderboardComponent;
  let fixture: ComponentFixture<RightBarCreatorsLeaderboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RightBarCreatorsLeaderboardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RightBarCreatorsLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
