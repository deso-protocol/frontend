import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
import { RightBarCreatorsComponent } from "../right-bar-creators.component";
import { HttpClient } from "@angular/common/http";
import {
  LeaderboardResponse,
  LeaderboardToDataAttribute,
  PulseLeaderboardType,
  PulseService,
} from "../../../lib/services/pulse/pulse-service";

@Component({
  selector: "right-bar-creators-leaderboard",
  templateUrl: "./right-bar-creators-leaderboard.component.html",
  styleUrls: ["./right-bar-creators-leaderboard.component.scss"],
})
export class RightBarCreatorsLeaderboardComponent implements OnInit {
  @Input() activeTab: string;

  static MAX_PROFILE_ENTRIES = 10;
  RightBarCreatorsComponent = RightBarCreatorsComponent;

  topGainerProfiles: any[] = [];

  topDiamondProfiles: any[] = [];

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

    pulseService.getBitCloutLockedLeaderboard().subscribe((res) => {
      pulseService.getProfilesForPulseLeaderboard(res, PulseLeaderboardType.BitCloutLocked).subscribe({
        next: (profiles: LeaderboardResponse[]) => {
          for (let ii = 0; ii < profiles.length; ii++) {
            if (profiles[ii]) {
              this.topGainerProfiles.push({
                Profile: profiles[ii].Profile,
                BitCloutLockedGained: res.results[ii][LeaderboardToDataAttribute[PulseLeaderboardType.BitCloutLocked]],
              });
            }
          }
        },
      });
    });

    pulseService.getDiamondsReceivedLeaderboard().subscribe((res) => {
      pulseService.getProfilesForPulseLeaderboard(res, PulseLeaderboardType.Diamonds).subscribe({
        next: (profiles: LeaderboardResponse[]) => {
          for (let ii = 0; ii < profiles.length; ii++) {
            if (profiles[ii]) {
              this.topDiamondProfiles.push({
                Profile: profiles[ii].Profile,
                DiamondsReceived: res.results[ii][LeaderboardToDataAttribute[PulseLeaderboardType.Diamonds]],
              });
            }
          }
        },
      });
    });
  }

  getActiveTabLeaderboard(): LeaderboardResponse[] {
    if (this.activeTab === RightBarCreatorsComponent.GAINERS.name) {
      return this.topGainerProfiles;
    }
    if (this.activeTab === RightBarCreatorsComponent.DIAMONDS.name) {
      return this.topDiamondProfiles;
    }
    return [];
  }
}
