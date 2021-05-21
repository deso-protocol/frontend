import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
import { RightBarCreatorsComponent } from "../right-bar-creators.component";
import { HttpClient } from "@angular/common/http";
import { PulseService } from "../../../lib/services/pulse/pulse-service";
import { BithuntService } from "../../../lib/services/bithunt/bithunt-service";

@Component({
  selector: "right-bar-creators-leaderboard",
  templateUrl: "./right-bar-creators-leaderboard.component.html",
  styleUrls: ["./right-bar-creators-leaderboard.component.scss"],
})
export class RightBarCreatorsLeaderboardComponent implements OnInit {
  @Input() activeTab: string;

  RightBarCreatorsComponent = RightBarCreatorsComponent;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private httpClient: HttpClient
  ) {}

  ngOnInit() {
    if (this.globalVars.rightBarLeaderboard.length > 0) {
      return;
    }

    const pulseService = new PulseService(this.httpClient, this.backendApi, this.globalVars);

    if (this.globalVars.topGainerLeaderboard.length === 0) {
      pulseService.getBitCloutLockedLeaderboard().subscribe((res) => (this.globalVars.topGainerLeaderboard = res));
    }
    if (this.globalVars.topDiamondedLeaderboard.length === 0) {
      pulseService.getDiamondsReceivedLeaderboard().subscribe((res) => (this.globalVars.topDiamondedLeaderboard = res));
    }

    const bithuntService = new BithuntService(this.httpClient, this.backendApi, this.globalVars);
    if (this.globalVars.topCommunityProjectsLeaderboard.length === 0) {
      bithuntService.getCommunityProjectsLeaderboard().subscribe((res) => {
        this.globalVars.allCommunityProjectsLeaderboard = res;
        this.globalVars.topCommunityProjectsLeaderboard = this.globalVars.allCommunityProjectsLeaderboard.slice(0, 10);
      });
    }
  }
}
