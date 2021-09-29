import { Component, Renderer2, ElementRef, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { BsModalService } from "ngx-bootstrap/modal";
import { Router } from "@angular/router";
import { IdentityService } from "../identity.service";
import { filter, get } from "lodash";

@Component({
  selector: "change-account-selector",
  templateUrl: "./change-account-selector.component.html",
  styleUrls: ["./change-account-selector.component.scss"],
})
export class ChangeAccountSelectorComponent {
  @ViewChild("changeAccountSelectorRoot", { static: true }) accountSelectorRoot: ElementRef;

  selectorOpen: boolean;
  hoverRow: number;

  constructor(
    public globalVars: GlobalVarsService,
    private renderer: Renderer2,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private identityService: IdentityService,
    private router: Router
  ) {
    this.selectorOpen = false;
  }

  launchLogoutFlow() {
    const publicKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    this.identityService.launch("/logout", { publicKey }).subscribe((res) => {
      this.globalVars.userList = filter(this.globalVars.userList, (user) => {
        return res?.users && user?.PublicKeyBase58Check in res?.users;
      });
      if (!res?.users) {
        this.globalVars.userList = [];
      }
      let loggedInUser = get(Object.keys(res?.users), "[0]");
      if (this.globalVars.userList.length === 0) {
        loggedInUser = null;
        this.globalVars.setLoggedInUser(null);
      }
      this.backendApi.setIdentityServiceUsers(res.users, loggedInUser);
      this.globalVars.updateEverything().add(() => {
        if (!this.globalVars.userInTutorial(this.globalVars.loggedInUser)) {
          this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]);
        }
      });
    });
  }

  _switchToUser(user) {
    this.globalVars.setLoggedInUser(user);
    this.globalVars.messageResponse = null;

    // Now we call update everything on the newly logged in user to make sure we have the latest info this user.
    this.globalVars.updateEverything().add(() => {
      if (!this.globalVars.userInTutorial(this.globalVars.loggedInUser)) {
        const currentUrl = this.router.url;
        this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]).then(() => {
          this.router.navigateByUrl(currentUrl);
        });
      }
      this.globalVars.isLeftBarMobileOpen = false;
    });
  }
}
