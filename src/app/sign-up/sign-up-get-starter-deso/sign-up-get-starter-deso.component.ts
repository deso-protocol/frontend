import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { IdentityService } from "../../identity.service";

@Component({
  selector: "sign-up-get-starter-deso",
  templateUrl: "./sign-up-get-starter-deso.component.html",
  styleUrls: ["./sign-up-get-starter-deso.component.scss"],
})
export class SignUpGetStarterDeSoComponent {
  static CREATE_PHONE_NUMBER_VERIFICATION_SCREEN = "create_phone_number_verification_screen";
  static COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN = "completed_phone_number_verification_screen";

  @Input() displayForSignupFlow = false;
  @Output() backToPreviousSignupStepClicked = new EventEmitter();
  @Output() phoneNumberVerified = new EventEmitter();
  @Output() skipButtonClicked = new EventEmitter();

  screenToShow = SignUpGetStarterDeSoComponent.CREATE_PHONE_NUMBER_VERIFICATION_SCREEN;
  SignUpGetStarterDeSoComponent = SignUpGetStarterDeSoComponent;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private identityService: IdentityService
  ) {}

  onSkipButtonClicked() {
    this.skipButtonClicked.emit();
  }

  openIdentityPhoneNumberVerification(): void {
    this.identityService
      .launchPhoneNumberVerification(this.globalVars?.loggedInUser?.PublicKeyBase58Check)
      .subscribe((res) => {
        if (res.phoneNumberSuccess) {
          this.globalVars.updateEverything().add(() => {
            this.screenToShow = SignUpGetStarterDeSoComponent.COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN;
          });
        }
      });
  }
}
