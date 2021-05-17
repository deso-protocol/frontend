import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService, ProfileEntryResponse } from "../../backend-api.service";

@Component({
  selector: "right-bar-creators-leaderboard",
  templateUrl: "./right-bar-creators-leaderboard.component.html",
  styleUrls: ["./right-bar-creators-leaderboard.component.scss"],
})
export class RightBarCreatorsLeaderboardComponent implements OnInit {
  static MAX_PROFILE_ENTRIES = 10;
  static rando = Math.random();

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService
  ) {}

  ngOnInit() {
    if (this.globalVars.rightBarLeaderboard.length > 0) {
      return;
    }

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
          this.globalVars.rightBarLeaderboard = response.ProfilesFound.slice(
            0,
            RightBarCreatorsLeaderboardComponent.MAX_PROFILE_ENTRIES
          );
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError("Error loading profiles: " + this.backendApi.stringifyError(err));
        }
      );

    this.backendApi.GetBitHuntLatestProjects().subscribe((response) => console.log(response));
  }

  getDiamonds(profile: ProfileEntryResponse): number {
    return Math.floor((RightBarCreatorsLeaderboardComponent.rando * profile.CoinEntry.BitCloutLockedNanos) / 1e9);
  }
}
