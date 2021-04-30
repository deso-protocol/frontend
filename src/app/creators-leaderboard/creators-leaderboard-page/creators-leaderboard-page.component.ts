import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-creators-leaderboard-page",
  templateUrl: "./creators-leaderboard-page.component.html",
  styleUrls: ["./creators-leaderboard-page.component.scss"],
})
export class CreatorsLeaderboardPageComponent {
  isLeftBarMobileOpen: boolean = false;

  constructor() {}
}
