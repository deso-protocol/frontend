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
  static MAX_PROFILE_ENTRIES = 10;
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

    if (this.globalVars.topCreatorsAllTimeLeaderboard.length === 0) {
      let readerPubKey = "";
      if (this.globalVars.loggedInUser) {
        readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
      }
      this.backendApi
        .GetProfiles(
          this.globalVars.localNode,
          null /*PublicKeyBase58Check*/,
          null /*Username*/,
          null /*UsernamePrefix*/,
          null /*Description*/,
          BackendApiService.GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE /*Order by*/,
          10 /*NumEntriesToReturn*/,
          readerPubKey /*ReaderPublicKeyBase58Check*/,
          "leaderboard" /*ModerationType*/,
          false /*FetchUsersThatHODL*/,
          false /*AddGlobalFeedBool*/
        )
        .subscribe(
          (response) => {
            this.globalVars.topCreatorsAllTimeLeaderboard = response.ProfilesFound.slice(
              0,
              RightBarCreatorsLeaderboardComponent.MAX_PROFILE_ENTRIES
            ).map((profile) => {
              return {
                Profile: profile,
              };
            });
          },
          (err) => {
            console.error(err);
            this.globalVars._alertError("Error loading profiles: " + this.backendApi.stringifyError(err));
          }
        );
    }
  }
}
