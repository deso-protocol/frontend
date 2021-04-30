import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorsLeaderboardComponent } from "./creators-leaderboard.component";

describe("CreatorsLeaderboardComponent", () => {
  let component: CreatorsLeaderboardComponent;
  let fixture: ComponentFixture<CreatorsLeaderboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreatorsLeaderboardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorsLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
