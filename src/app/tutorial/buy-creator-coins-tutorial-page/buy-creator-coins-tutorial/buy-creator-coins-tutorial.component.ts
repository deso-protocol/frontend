import {Component, OnInit} from "@angular/core";
import {GlobalVarsService} from "../../../global-vars.service";
import {BackendApiService, ProfileEntryResponse, TutorialStatus} from "../../../backend-api.service";
import {AppRoutingModule} from "../../../app-routing.module";
import {CanPublicKeyFollowTargetPublicKeyHelper} from "../../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import {Title} from "@angular/platform-browser";
import {RightBarCreatorsLeaderboardComponent} from "../../../right-bar-creators/right-bar-creators-leaderboard/right-bar-creators-leaderboard.component";

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
  loading: boolean = true;

  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title
  ) {}

  topCreatorsToHighlight: ProfileEntryResponse[];
  upAndComingCreatorsToHighlight: ProfileEntryResponse[];

  loggedInUserProfile: ProfileEntryResponse;
  investInYourself: boolean = false;

  ngOnInit() {
    // this.isLoadingProfilesForFirstTime = true;
    this.titleService.setTitle("Buy Creator Coins Tutorial - BitClout");
    // If the user just completed their profile, we instruct them to buy their own coin.
    if (this.globalVars.loggedInUser?.TutorialStatus === TutorialStatus.CREATE_PROFILE) {
      this.loggedInUserProfile = this.globalVars.loggedInUser?.ProfileEntryResponse;
      this.investInYourself = true;
      this.loading = false;
      return;
    }
    this.backendApi
      .GetTutorialCreators(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 2)
      .subscribe(
        (res: {
          WellKnownProfileEntryResponses: ProfileEntryResponse[];
          UpAndComingProfileEntryResponses: ProfileEntryResponse[];
        }) => {
          // Do not let users select themselves in the "Invest In Others" step.
          this.topCreatorsToHighlight = res.WellKnownProfileEntryResponses.filter(
            (profile) => profile.PublicKeyBase58Check !== this.globalVars.loggedInUser?.PublicKeyBase58Check
          );
          this.upAndComingCreatorsToHighlight = res.UpAndComingProfileEntryResponses.filter(
            (profile) => profile.PublicKeyBase58Check !== this.globalVars.loggedInUser?.PublicKeyBase58Check
          );
          this.loading = false;
        },
        (err) => {
          console.error(err);
        }
      );
  }
}
