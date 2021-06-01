import { Component, OnInit, Renderer2, ElementRef, ViewChild, TemplateRef } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, User } from "../backend-api.service";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { Router } from "@angular/router";
import { IdentityService } from "../identity.service";

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
    this._setUpClickListener();
  }

  launchLogoutFlow() {
    const publicKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    this.identityService.launch("/logout", { publicKey }).subscribe((res) => {
      this.backendApi.setIdentityServiceUsers(res.users, Object.keys(res.users)[0]);
      this.globalVars.updateEverything().subscribe(() => {
        this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]);
      });
    });
  }

  _switchToUser(user) {
    this.globalVars.setLoggedInUser(user);
    this.globalVars.messageResponse = null
    this.globalVars.SetupMessages()

    this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], {
      queryParamsHandling: "merge",
    });

    this.globalVars.isLeftBarMobileOpen = false;
  }

  // TODO: Cleanup - we should consider using a dropdown library that does all this hard work for us
  _setUpClickListener() {
    this.renderer.listen("window", "touchstart", (e: any) => {
      if (e.touches.length > 0 && e.touches[0].target.offsetParent) {
        if (e.touches[0].target.offsetParent === this.accountSelectorRoot.nativeElement) {
          if (!this.selectorOpen) {
            this.selectorOpen = true;
          }
          return;
        }
      } else {
        for (let ii = 0; ii < e.path.length; ii++) {
          if (e.path[ii] === this.accountSelectorRoot.nativeElement) {
            if (!this.selectorOpen) {
              this.selectorOpen = true;
            }
            return;
          }
        }
      }
      // If we get here, the user did not click the selector.
      this.selectorOpen = false;
    });

    this.renderer.listen("window", "click", (e: any) => {
      if (e.path === undefined) {
        if (e.target.offsetParent === this.accountSelectorRoot.nativeElement) {
          this.selectorOpen = true;
          return;
        }
      } else {
        for (let ii = 0; ii < e.path.length; ii++) {
          if (e.path[ii] === this.accountSelectorRoot.nativeElement) {
            this.selectorOpen = true;
            return;
          }
        }
      }
      // If we get here, the user did not click the selector.
      this.selectorOpen = false;
    });
  }
}
