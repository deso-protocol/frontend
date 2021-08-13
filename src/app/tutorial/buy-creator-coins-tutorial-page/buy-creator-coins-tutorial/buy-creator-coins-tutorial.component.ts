import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../../../backend-api.service";
import { AppRoutingModule } from "../../../app-routing.module";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { Title } from "@angular/platform-browser";
import { RightBarCreatorsLeaderboardComponent } from "../../../right-bar-creators/right-bar-creators-leaderboard/right-bar-creators-leaderboard.component";

@Component({
  selector: "buy-creator-coins-tutorial",
  templateUrl: "./buy-creator-coins-tutorial.component.html",
  styleUrls: ["./buy-creator-coins-tutorial.component.scss"],
})
export class BuyCreatorCoinsTutorialComponent implements OnInit {
  static PAGE_SIZE = 100;
  static WINDOW_VIEWPORT = true;
  static BUFFER_SIZE = 5;

  AppRoutingModule = AppRoutingModule;

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title
  ) {}

  topCreatorsToHighlight: ProfileEntryResponse[];
  upAndComingCreatorsToHighlight: ProfileEntryResponse[];

  ngOnInit() {
    // this.isLoadingProfilesForFirstTime = true;
    this.titleService.setTitle("Buy Creator Coins Tutorial - BitClout");
    // TODO: replace with real data
    this.backendApi
      .GetProfiles(
        this.globalVars.localNode,
        null /*PublicKeyBase58Check*/,
        null /*Username*/,
        null /*UsernamePrefix*/,
        null /*Description*/,
        BackendApiService.GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE /*Order by*/,
        10 /*NumEntriesToReturn*/,
        "" /*ReaderPublicKeyBase58Check*/,
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
          this.topCreatorsToHighlight = this.globalVars.topCreatorsAllTimeLeaderboard.map((x) => x.Profile);
          this.upAndComingCreatorsToHighlight = this.globalVars.topCreatorsAllTimeLeaderboard.map((x) => x.Profile);
        },
        (err) => {
          console.error(err);
        }
      );
  }

  canLoggedInUserFollowTargetPublicKey(targetPubKeyBase58Check) {
    return CanPublicKeyFollowTargetPublicKeyHelper.execute(
      this.globalVars.loggedInUser.PublicKeyBase58Check,
      targetPubKeyBase58Check
    );
  }
}
