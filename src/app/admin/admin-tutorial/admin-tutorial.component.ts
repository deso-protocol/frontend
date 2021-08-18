import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { filter } from "lodash";

@Component({
  selector: "admin-tutorial",
  templateUrl: "./admin-tutorial.component.html",
})
export class AdminTutorialComponent implements OnInit {
  globalVars: GlobalVarsService;

  profileEntryResponses = null;
  upAndComingProfiles = [];
  wellKnownProfiles = [];
  loading = false;
  WELL_KNOWN_TAB = "Well Known";
  UP_AND_COMING_TAB = "Up And Coming";
  RESET_TAB = "Reset";
  adminTutorialTabs = [this.WELL_KNOWN_TAB, this.UP_AND_COMING_TAB, this.RESET_TAB];
  activeTutorialTab = this.WELL_KNOWN_TAB;
  filteredProfileEntryResponses = null;
  publicKeyToReset: string = "";
  resettingTutorial: boolean = false;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  _tutorialTabClicked(tutorialTabName: string) {
    this.activeTutorialTab = tutorialTabName;
    if (this.activeTutorialTab === this.RESET_TAB) {
      return;
    }
    this.filteredProfileEntryResponses =
      tutorialTabName === this.WELL_KNOWN_TAB ? this.wellKnownProfiles : this.upAndComingProfiles;
  }

  ngOnInit(): void {
    this.loading = true;
    this.backendApi
      .AdminGetTutorialCreators(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 500)
      .subscribe(
        (res) => {
          this.wellKnownProfiles = res.WellKnownProfileEntryResponses;
          this.upAndComingProfiles = res.UpAndComingProfileEntryResponses;
          this.filteredProfileEntryResponses = this.wellKnownProfiles;
          this.loading = false;
        },
        (err) => {
          console.error(err);
        }
      );
  }

  removeCreatorFeaturedTutorialList(profilePublicKeyBase58Check: string, event) {
    event.stopPropagation();
    this.backendApi
      .AdminUpdateTutorialCreators(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        profilePublicKeyBase58Check,
        true,
        this.activeTutorialTab === this.WELL_KNOWN_TAB
      )
      .subscribe(
        (res) => {
          this.filteredProfileEntryResponses = filter(this.filteredProfileEntryResponses, (profileEntryResponse) => {
            return profileEntryResponse.PublicKeyBase58Check != profilePublicKeyBase58Check;
          });
          if (this.activeTutorialTab === this.WELL_KNOWN_TAB) {
            this.wellKnownProfiles = filter(this.wellKnownProfiles, (profileEntryResponse) => {
              return profileEntryResponse.PublicKeyBase58Check != profilePublicKeyBase58Check;
            });
          } else {
            this.upAndComingProfiles = filter(this.upAndComingProfiles, (profileEntryResponse) => {
              return profileEntryResponse.PublicKeyBase58Check != profilePublicKeyBase58Check;
            });
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }

  _resetTutorial(): void {
    this.resettingTutorial = true;
    this.backendApi
      .AdminResetTutorialStatus(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.publicKeyToReset
      )
      .subscribe(
        (res) => {},
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.resettingTutorial = false));
  }

}
