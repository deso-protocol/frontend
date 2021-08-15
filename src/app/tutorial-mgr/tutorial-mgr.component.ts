import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { concat, map } from "lodash";

@Component({
  selector: "tutorial-mgr",
  templateUrl: "./tutorial-mgr.component.html",
})
export class TutorialMgrComponent implements OnInit {
  globalVars: GlobalVarsService;

  profileEntryResponses = [];
  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
    this.backendApi
      .AdminGetTutorialCreators(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 500)
      .subscribe(
        (res) => {
          this.backendApi
            .GetUsersStateless(
              this.globalVars.localNode,
              concat(res.WellKnownPublicKeysBase58Check, res.UndiscoveredPublicKeysBase58Check),
              false
            )
            .subscribe(
              (res) => {
                this.profileEntryResponses = map(res?.UserList, "ProfileEntryResponse");
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
}
