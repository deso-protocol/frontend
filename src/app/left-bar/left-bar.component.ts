import { Component, EventEmitter, HostBinding, Input, Output } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule, RouteNames } from "../app-routing.module";
import { MessagesInboxComponent } from "../messages-page/messages-inbox/messages-inbox.component";
import { IdentityService } from "../identity.service";
import { BackendApiService, TutorialStatus } from "../backend-api.service";
import { Router } from "@angular/router";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { BsModalService } from "ngx-bootstrap/modal";
import { FeedCreatePostModalComponent } from "../feed/feed-create-post-modal/feed-create-post-modal.component";
import { filter, get } from "lodash";

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

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    private identityService: IdentityService,
    private backendApi: BackendApiService,
    private router: Router
  ) {}

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

  openCreatePostModal() {
    this.modalService.show(FeedCreatePostModalComponent, {
      class: "modal-dialog-centered",
    });
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

  launchLogoutFlow() {
    const publicKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    this.identityService.launch("/logout", { publicKey }).subscribe((res) => {
      this.globalVars.userList = filter(this.globalVars.userList, (user) => {
        return res?.users && user?.PublicKeyBase58Check in res?.users;
      });
      if (!res?.users) {
        this.globalVars.userList = [];
      }
      let loggedInUser = get(Object.keys(res?.users),"[0]");
      if (this.globalVars.userList.length === 0) {
        loggedInUser = null;
        this.globalVars.setLoggedInUser(null);
      }
      this.backendApi.setIdentityServiceUsers(res.users, loggedInUser);
      this.globalVars.updateEverything().add(() => {
        this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]);
      });
    });
  }

  startTutorial(): void {
    if (this.inTutorial) {
      return;
    }
    // If the user hes less than 1/100th of a clout they need more clout for the tutorial.
    if (this.globalVars.loggedInUser?.BalanceNanos < 1e7) {
      SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: "info",
        title: `You need 0.01 $DESO to complete the tutorial`,
        showConfirmButton: true,
        focusConfirm: true,
        customClass: {
          confirmButton: "btn btn-light",
        },
        confirmButtonText: "Buy $DESO",
      }).then((res) => {
        if (res.isConfirmed) {
          this.router.navigate([RouteNames.BUY_BITCLOUT], { queryParamsHandling: "merge" });
        }
      });
      return;
    }

    if (this.globalVars.userInTutorial(this.globalVars.loggedInUser)) {
      this.globalVars.navigateToCurrentStepInTutorial(this.globalVars.loggedInUser);
      return;
    }
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Tutorial",
      html: "Learn how BitClout works!",
      showConfirmButton: true,
      // Only show skip option to admins and users who do not need to complete tutorial
      showCancelButton: !!this.globalVars.loggedInUser?.IsAdmin || !this.globalVars.loggedInUser?.MustCompleteTutorial,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
      confirmButtonText: "Start Tutorial",
      cancelButtonText: "Cancel",
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
