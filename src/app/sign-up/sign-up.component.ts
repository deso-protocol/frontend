import { Component, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, User } from "../backend-api.service";
import { CountryISO, PhoneNumberFormat } from "ngx-intl-tel-input";
import { FeedComponent } from "../feed/feed.component";

@Component({
  selector: "sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent {
  stepNum: number;
  loading: boolean = false;
  countryISO = CountryISO;
  emailAddress = "";
  invalidEmailEntered = false;
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required]),
  });
  storingEmailAndPhone = false;
  showPhoneNumberVerifiedContent = false;

  constructor(
    private globalVars: GlobalVarsService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.route.queryParams.subscribe((queryParams) => {
      this.stepNum = 1;
      if (queryParams.stepNum) {
        this.stepNum = parseInt(queryParams.stepNum);
      }
    });
  }

  ////// NOTIFICATIONS STEP BUTTONS ///////

  _notificationsStepNext() {
    this.globalVars.logEvent("account : create : notifications-step");
    this._storeEmail();
  }
  _notificationsStepSkip() {
    this.globalVars.logEvent("account : create : notifications-step : skip");
    this._nextPage();
  }

  ////// OTHER ///////

  _nextPage() {
    this.stepNum += 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stepNum: this.stepNum },
      queryParamsHandling: "merge",
    });
  }

  _prevPage() {
    this.stepNum -= 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stepNum: this.stepNum },
      queryParamsHandling: "merge",
    });
  }

  _validateEmail(email) {
    if (email === "" || this.globalVars.emailRegExp.test(email)) {
      this.invalidEmailEntered = false;
    } else {
      this.invalidEmailEntered = true;
    }
  }

  _backToPreviousSignupStepClicked() {
    this.globalVars.logEvent("account : create : create-phone-number-verification : back");
    this._prevPage();
  }

  _phoneNumberVerified() {
    this.showPhoneNumberVerifiedContent = true;
    this._nextPage();
  }

  _skipButtonClickedOnStarterBitCloutStep() {
    this.globalVars.logEvent("account : create : create-phone-number-verification : skip");
    this._nextPage();
  }

  _storeEmail() {
    this.storingEmailAndPhone = true;
    this.backendApi
      .UpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.emailAddress /*EmailAddress*/,
        null /*MessageReadStateUpdatesByContact*/
      )
      .subscribe(
        (res) => {},
        (err) => {
          // TODO: shouldn't we ask the user to try again?
          // TODO: rollbar
          console.log(err);
        }
      )
      .add(() => {
        this.storingEmailAndPhone = false;
        this._nextPage();
      });
  }

  buyBitCloutClicked(): void {
    this.globalVars.logEvent("account : create : buy-bitclout");
    this.router.navigate(["/" + this.globalVars.RouteNames.BUY_BITCLOUT], {
      queryParams: { stepNum: null },
      queryParamsHandling: "merge",
    });
  }

  buyBitCloutSkipped(): void {
    this.globalVars.logEvent("account : create : buy-bitclout");
    this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE], {
      queryParams: { stepNum: null, feedTab: FeedComponent.GLOBAL_TAB },
      queryParamsHandling: "merge",
    });
  }
}
