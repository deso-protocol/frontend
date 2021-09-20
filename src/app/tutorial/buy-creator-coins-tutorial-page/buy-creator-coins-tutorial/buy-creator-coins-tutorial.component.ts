import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, ProfileEntryResponse, TutorialStatus } from "../../../backend-api.service";
import { AppRoutingModule } from "../../../app-routing.module";
import { Title } from "@angular/platform-browser";

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
    public globalVars: GlobalVarsService,
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
      .GetTutorialCreators(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 3)
      .subscribe(
        (res: {
          WellKnownProfileEntryResponses: ProfileEntryResponse[];
          UpAndComingProfileEntryResponses: ProfileEntryResponse[];
        }) => {
          // Do not let users select themselves in the "Invest In Others" step.
          if (res.WellKnownProfileEntryResponses?.length) {
            this.topCreatorsToHighlight = res.WellKnownProfileEntryResponses.filter(
              (profile) => profile.PublicKeyBase58Check !== this.globalVars.loggedInUser?.PublicKeyBase58Check
            );
          }

          if (res.UpAndComingProfileEntryResponses?.length) {
            this.upAndComingCreatorsToHighlight = res.UpAndComingProfileEntryResponses.filter(
              (profile) => profile.PublicKeyBase58Check !== this.globalVars.loggedInUser?.PublicKeyBase58Check
            );
          }
          this.loading = false;
        },
        (err) => {
          console.error(err);
        }
      );
  }
}
