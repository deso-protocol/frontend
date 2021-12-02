import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../global-vars.service";
import { FeedComponent } from "../feed/feed.component";

@Component({
  selector: "sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent {
  stepNum: number;
  loading: boolean = false;
  emailAddress = "";
  invalidEmailEntered = false;
  storingEmailAndPhone = false;
  showPhoneNumberVerifiedContent = false;

  constructor(private globalVars: GlobalVarsService, private router: Router, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((queryParams) => {
      this.stepNum = 1;
      if (queryParams.stepNum) {
        this.stepNum = parseInt(queryParams.stepNum);
      }
    });
  }

  ////// NOTIFICATIONS STEP BUTTONS ///////

  notificationsStepSkipped(): void {
    this.globalVars.logEvent("account : create : notifications-step : skip");
    this.nextPage();
  }

  notificationsStepNext() {
    this.validateEmail();

    if (this.invalidEmailEntered || this.emailAddress.length <= 0) {
      return;
    }

    this.globalVars.logEvent("account : create : notifications-step");
    this.storeEmail();
  }

  ////// OTHER ///////

  nextPage() {
    this.stepNum += 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stepNum: this.stepNum },
      queryParamsHandling: "merge",
    });
  }

  prevPage() {
    this.stepNum -= 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stepNum: this.stepNum },
      queryParamsHandling: "merge",
    });
  }

  validateEmail() {
    if (this.emailAddress.length > 0 && this.globalVars.emailRegExp.test(this.emailAddress)) {
      this.invalidEmailEntered = false;
    } else {
      this.invalidEmailEntered = true;
    }
  }

  backToPreviousSignupStepClicked() {
    this.globalVars.logEvent("account : create : create-phone-number-verification : back");
    this.prevPage();
  }

  phoneNumberVerified() {
    this.showPhoneNumberVerifiedContent = true;
    this.nextPage();
  }

  skipButtonClickedOnStarterDeSoStep() {
    this.globalVars.logEvent("account : create : create-phone-number-verification : skip");
    this.nextPage();
  }

  storeEmail() {
    // this.storingEmailAndPhone = true;
    // this.backendApi
    //   .UpdateUserGlobalMetadata(
    //     this.globalVars.localNode,
    //     this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
    //     this.emailAddress /*EmailAddress*/,
    //     null /*MessageReadStateUpdatesByContact*/
    //   )
    //   .subscribe(
    //     (res) => {},
    //     (err) => {
    //       // TODO: shouldn't we ask the user to try again?
    //       // TODO: rollbar
    //       console.log(err);
    //     }
    //   )
    //   .add(() => {
    //     this.storingEmailAndPhone = false;
    //     this.nextPage();
    //   });

    // FIXME: Skip storing the email for now until we figure out
    // some edge cases around Sendgrid integration
    this.nextPage();
  }

  buyDeSoClicked(): void {
    this.globalVars.logEvent("account : create : buy-deso");
    this.router.navigate(["/" + this.globalVars.RouteNames.BUY_DESO], {
      queryParams: { stepNum: null },
      queryParamsHandling: "merge",
    });
  }

  buyDeSoSkipped(): void {
    this.globalVars.logEvent("account : create : buy-deso : skip");
    this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], {
      queryParams: { stepNum: null, feedTab: FeedComponent.GLOBAL_TAB },
      queryParamsHandling: "merge",
    });
  }
}
