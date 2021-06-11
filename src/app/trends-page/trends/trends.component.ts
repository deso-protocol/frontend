import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
import { HttpClient } from "@angular/common/http";
import { PulseService } from "../../../lib/services/pulse/pulse-service";
import { BithuntService } from "../../../lib/services/bithunt/bithunt-service";
import { RightBarCreatorsComponent } from "../../right-bar-creators/right-bar-creators.component";

@Component({
  selector: "trends",
  templateUrl: "./trends.component.html",
  styleUrls: ["./trends.component.scss"],
})
export class TrendsComponent implements OnInit {
  RightBarCreatorsComponent = RightBarCreatorsComponent;

  tabs: string[] = Object.keys(RightBarCreatorsComponent.chartMap);
  activeTab: string;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private httpClient: HttpClient
  ) {
    this.route.queryParams.subscribe((params) => {
      this.activeTab = params.tab && params.tab in this.tabs ? params.tab : this.tabs[0];
    });
  }

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
              TrendsComponent.MAX_PROFILE_ENTRIES
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
