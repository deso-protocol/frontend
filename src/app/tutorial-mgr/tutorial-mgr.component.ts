import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { concat, filter, map } from "lodash";

@Component({
  selector: "tutorial-mgr",
  templateUrl: "./tutorial-mgr.component.html",
})
export class TutorialMgrComponent implements OnInit {
  globalVars: GlobalVarsService;

  profileEntryResponses = null;
  loading = false;
  WELL_KNOWN_TAB = "Well Known";
  UP_AND_COMING_TAB = "Up And Coming";
  adminTutorialTabs = [this.WELL_KNOWN_TAB, this.UP_AND_COMING_TAB];
  activeTutorialTab = this.WELL_KNOWN_TAB;
  filteredProfileEntryResponses = null;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  _tutorialTabClicked(tutorialTabName: string) {
    this.activeTutorialTab = tutorialTabName;
    if (tutorialTabName === this.WELL_KNOWN_TAB) {
      this.filteredProfileEntryResponses = filter(this.profileEntryResponses, {
        IsFeaturedTutorialWellKnownCreator: true,
      });
    } else {
      this.filteredProfileEntryResponses = filter(this.profileEntryResponses, {
        IsFeaturedTutorialUpAndComingCreator: true,
      });
    }
  }

  ngOnInit(): void {
    this.loading = true;
    this.backendApi
      .GetTutorialCreators(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 500)
      .subscribe(
        (res) => {
          this.backendApi
            .GetUsersStateless(
              this.globalVars.localNode,
              concat(res.WellKnownPublicKeysBase58Check, res.UpAndComingPublicKeysBase58Check),
              false
            )
            .subscribe(
              (res) => {
                this.profileEntryResponses = map(res?.UserList, "ProfileEntryResponse");
                this.filteredProfileEntryResponses = filter(this.profileEntryResponses, {
                  IsFeaturedTutorialWellKnownCreator: true,
                });
                this.loading = false;
              },
              (err) => {
                console.error(err);
              }
            );
        },
        (err) => {
          console.error(err);
        }
      );
  }

  removeCreatorFeaturedTutorialList(isWellKnown: boolean, profilePublicKeyBase58Check: string) {
    this.backendApi
      .AdminUpdateTutorialCreators(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        profilePublicKeyBase58Check,
        true,
        isWellKnown
      )
      .subscribe(
        (res) => {
          this.profileEntryResponses = filter(this.profileEntryResponses, (profileEntryResponse) => {
            return profileEntryResponse.PublicKeyBase58Check != profilePublicKeyBase58Check;
          });
        },
        (err) => {
          console.error(err);
        }
      );
  }
}
