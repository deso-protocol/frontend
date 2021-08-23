import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule, RouteNames } from "../app-routing.module";
import { MessagesInboxComponent } from "../messages-page/messages-inbox/messages-inbox.component";
import { IdentityService } from "../identity.service";
import { BackendApiService, TutorialStatus } from "../backend-api.service";
import { Router } from "@angular/router";
import { SwalHelper } from "../../lib/helpers/swal-helper";

@Component({
  selector: "left-bar",
  templateUrl: "./left-bar.component.html",
  styleUrls: ["./left-bar.component.sass"],
})
export class LeftBarComponent {
  MessagesInboxComponent = MessagesInboxComponent;

  @HostBinding("class") get classes() {
    return !this.isMobile ? "global__nav__flex" : "";
  }

  @Input() isMobile = false;
  @Input() inTutorial: boolean = false;
  @Output() closeMobile = new EventEmitter<boolean>();
  currentRoute: string;

  AppRoutingModule = AppRoutingModule;
  showTutorialOption: boolean;

  constructor(
    public globalVars: GlobalVarsService,
    private identityService: IdentityService,
    private backendApi: BackendApiService,
    private router: Router
  ) {
    this.showTutorialOption =
      globalVars.loggedInUser?.BalanceNanos > 0 &&
      [TutorialStatus.EMPTY, TutorialStatus.SKIPPED].indexOf(globalVars.loggedInUser?.TutorialStatus) >= 0;
  }

  // send logged out users to the landing page
  // send logged in users to browse
  homeLink(): string | string[] {
    if (this.inTutorial) {
      return [];
    }
    if (this.globalVars.showLandingPage()) {
      return "/" + this.globalVars.RouteNames.LANDING;
    }
    return "/" + this.globalVars.RouteNames.BROWSE;
  }

  getHelpMailToAttr(): string {
    const loggedInUser = this.globalVars.loggedInUser;
    const pubKey = loggedInUser?.PublicKeyBase58Check;
    const btcAddress = this.identityService.identityServiceUsers[pubKey]?.btcDepositAddress;
    const bodyContent = encodeURIComponent(
      `The below information helps support address your case.\nMy public key: ${pubKey} \nMy BTC Address: ${btcAddress}`
    );
    const body = loggedInUser ? `?body=${bodyContent}` : "";
    return `mailto:${this.globalVars.supportEmail}${body}`;
  }

  logHelp(): void {
    this.globalVars.logEvent("help : click");
  }

  startTutorial(): void {
    if (this.inTutorial) {
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Tutorial",
      html: "<b>Learn how BitClout works!</b>",
      showConfirmButton: true,
      // Only show skip option to admins and users who do not need to complete tutorial
      showCancelButton: !!this.globalVars.loggedInUser?.IsAdmin || !this.globalVars.loggedInUser?.MustCompleteTutorial,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
      confirmButtonText: "Start Tutorial",
      cancelButtonText: "Skip",
    }).then((res) => {
      this.backendApi
        .StartOrSkipTutorial(
          this.globalVars.localNode,
          this.globalVars.loggedInUser?.PublicKeyBase58Check,
          !res.isConfirmed /* if it's not confirmed, skip tutorial*/
        )
        .subscribe((response) => {
          this.globalVars.logEvent(`tutorial : ${res.isConfirmed ? "start" : "skip"}`);
          // Auto update logged in user's tutorial status - we don't need to fetch it via get users stateless right now.
          this.globalVars.loggedInUser.TutorialStatus = res.isConfirmed
            ? TutorialStatus.STARTED
            : TutorialStatus.SKIPPED;
          if (res.isConfirmed) {
            this.router.navigate([RouteNames.TUTORIAL, RouteNames.INVEST, RouteNames.BUY_CREATOR]);
          }
        });
    });
  }
}
