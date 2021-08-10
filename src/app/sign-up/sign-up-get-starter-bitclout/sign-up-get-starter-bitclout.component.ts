import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CountryISO } from "ngx-intl-tel-input";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { MessagesInboxComponent } from "../../messages-page/messages-inbox/messages-inbox.component";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "sign-up-get-starter-bitclout",
  templateUrl: "./sign-up-get-starter-bitclout.component.html",
  styleUrls: ["./sign-up-get-starter-bitclout.component.scss"],
})
export class SignUpGetStarterBitcloutComponent implements OnInit {
  static CREATE_PHONE_NUMBER_VERIFICATION_SCREEN = "create_phone_number_verification_screen";
  static SUBMIT_PHONE_NUMBER_VERIFICATION_SCREEN = "submit_phone_number_verification_screen";
  static COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN = "completed_phone_number_verification_screen";

  @Input() displayForSignupFlow = false;
  @Output() backToPreviousSignupStepClicked = new EventEmitter();
  @Output() phoneNumberVerified = new EventEmitter();
  @Output() skipButtonClicked = new EventEmitter();

  MessagesInboxComponent = MessagesInboxComponent;

  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required]),
  });
  verificationCodeForm = new FormGroup({
    verificationCode: new FormControl(undefined, [Validators.required]),
  });

  CountryISO = CountryISO;
  sendingPhoneNumberVerificationText = false;
  submittingPhoneNumberVerificationCode = false;
  screenToShow = null;
  //screenToShow = SignUpGetStarterBitcloutComponent.SUBMIT_PHONE_NUMBER_VERIFICATION_SCREEN;
  SignUpGetStarterBitcloutComponent = SignUpGetStarterBitcloutComponent;
  phoneNumber: string;
  phoneNumberCountryCode: string = null;
  resentVerificationCode = false;
  sendPhoneNumberVerificationTextServerErrors = new SendPhoneNumberVerificationTextServerErrors();
  submitPhoneNumberVerificationCodeServerErrors = new SubmitPhoneNumberVerificationCodeServerErrors();

  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  ngOnInit(): void {
    this._setScreenToShow();
  }

  _setScreenToShow() {
    // TODO: refactor silly setInterval
    let interval = setInterval(() => {
      if (this.globalVars.loggedInUser.HasPhoneNumber == null) {
        // Wait until we've loaded the HasPhoneNumber boolean from the server
        return;
      }

      if (this.globalVars.loggedInUser.HasPhoneNumber) {
        this.screenToShow = SignUpGetStarterBitcloutComponent.COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN;
      } else {
        this.screenToShow = SignUpGetStarterBitcloutComponent.CREATE_PHONE_NUMBER_VERIFICATION_SCREEN;
      }

      clearInterval(interval);
    }, 50);
  }

  backToPreviousSignupStepOnClick() {
    this.backToPreviousSignupStepClicked.emit();
  }

  backButtonClickedOnSubmitVerificationScreen() {
    this.screenToShow = SignUpGetStarterBitcloutComponent.CREATE_PHONE_NUMBER_VERIFICATION_SCREEN;
  }

  sendVerificationText() {
    if (this.phoneForm.invalid) {
      return;
    }

    this.globalVars.logEvent("account : create : send-verification-text");
    this._sendPhoneNumberVerificationText();
  }

  resendVerificationCode(event) {
    event.stopPropagation();
    event.preventDefault();

    // Return if the user just resent the verification code (to prevent multiple unnecessary texts)
    if (this.resentVerificationCode) {
      return false;
    }

    // Clear any existing resend-related errors
    this.sendPhoneNumberVerificationTextServerErrors = new SendPhoneNumberVerificationTextServerErrors();

    this.globalVars.logEvent("account : create : resend-phone-number");
    this._sendPhoneNumberVerificationText();

    // Display a success indicator
    this.resentVerificationCode = true;
    setTimeout(() => (this.resentVerificationCode = false), 5000);

    return false;
  }

  submitVerificationCode() {
    if (this.verificationCodeForm.invalid) {
      return;
    }

    this.globalVars.logEvent("account : create : submit-verification-code");
    this._submitPhoneNumberVerificationCode();
  }

  onSkipButtonClicked() {
    this.skipButtonClicked.emit();
  }

  onPhoneNumberInputChanged() {
    this.sendPhoneNumberVerificationTextServerErrors = new SendPhoneNumberVerificationTextServerErrors();
  }

  onVerificationCodeInputChanged() {
    this.submitPhoneNumberVerificationCodeServerErrors = new SubmitPhoneNumberVerificationCodeServerErrors();
  }

  _sendPhoneNumberVerificationText() {
    this.phoneNumber = this.phoneForm.value.phone?.e164Number;
    this.phoneNumberCountryCode = this.phoneForm.value.phone?.countryCode;
    this.sendingPhoneNumberVerificationText = true;

    this.backendApi
      .SendPhoneNumberVerificationText(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.phoneNumber /*PhoneNumber*/,
        this.phoneNumberCountryCode /*PhoneNumberCountryCode*/
      )
      .subscribe(
        (res) => {
          this.screenToShow = SignUpGetStarterBitcloutComponent.SUBMIT_PHONE_NUMBER_VERIFICATION_SCREEN;
          this.globalVars.logEvent("account : create : send-verification-text: success");
        },
        (err) => {
          this._parseSendPhoneNumberVerificationTextServerErrors(err);
        }
      )
      .add(() => {
        this.sendingPhoneNumberVerificationText = false;
      });
  }

  _parseSendPhoneNumberVerificationTextServerErrors(err) {
    if (err.error.error.includes("Phone number already in use")) {
      this.sendPhoneNumberVerificationTextServerErrors.phoneNumberAlreadyInUse = true;
    } else if (err.error.error.includes("Max send attempts reached")) {
      // https://www.twilio.com/docs/api/errors/60203
      this.sendPhoneNumberVerificationTextServerErrors.maxSendAttemptsReached = true;
    } else if (err.error.error.includes("VOIP number not allowed")) {
      this.sendPhoneNumberVerificationTextServerErrors.voipNumberNotAllowed = true;
    } else if (err.error.error.includes("Messages to China require use case vetting")) {
      // https://www.twilio.com/docs/api/errors/60220
      this.sendPhoneNumberVerificationTextServerErrors.chineseNumberNotAllowed = true;
    } else {
      this.globalVars._alertError(
        "Error sending phone number verification text: " + this.backendApi.stringifyError(err)
      );
    }
  }

  _parseSubmitPhoneNumberVerificationCodeServerErrors(err) {
    if (err.error.error.includes("Invalid parameter: Code")) {
      // https://www.twilio.com/docs/api/errors/60200
      this.submitPhoneNumberVerificationCodeServerErrors.invalidCode = true;
    } else if (err.error.error.includes("requested resource")) {
      // https://www.twilio.com/docs/api/errors/20404
      this.submitPhoneNumberVerificationCodeServerErrors.invalidCode = true;
    } else if (err.error.error.includes("Code is not valid")) {
      this.submitPhoneNumberVerificationCodeServerErrors.invalidCode = true;
    } else if (err.error.error.includes("Max check attempts reached")) {
      // https://www.twilio.com/docs/api/errors/60202
      this.submitPhoneNumberVerificationCodeServerErrors.maxCheckAttemptsReached = true;
    } else {
      this.globalVars._alertError(
        "Error submittting phone number verification code: " + this.backendApi.stringifyError(err)
      );
    }
  }

  _submitPhoneNumberVerificationCode() {
    this.submittingPhoneNumberVerificationCode = true;

    this.backendApi
      .SubmitPhoneNumberVerificationCode(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.phoneNumber /*PhoneNumber*/,
        this.phoneNumberCountryCode /*PhoneNumberCountryCode*/,
        this.verificationCodeForm.value.verificationCode
      )
      .subscribe(
        (res) => {
          // Pull the CanCreateProfile boolean from the server
          this.globalVars.updateEverything(
            res.TxnHashHex,
            this._getStarterBitCloutSuccess,
            this._getStarterBitCloutFailure,
            this
          );
          this.globalVars.logEvent("account : create : submit-verification-code: success");
        },
        (err) => {
          this._parseSubmitPhoneNumberVerificationCodeServerErrors(err);
          this.submittingPhoneNumberVerificationCode = false;
        }
      );
  }

  _getStarterBitCloutSuccess(comp: any): void {
    comp.screenToShow = SignUpGetStarterBitcloutComponent.COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN;
    comp.submittingPhoneNumberVerificationCode = false;
    comp.phoneNumberVerified.emit();
  }

  _getStarterBitCloutFailure(comp: any): void {
    comp.globalVars._alertError(
      "Your starter BitClout is on it's way.  The transaction broadcast successfully but read node timeout exceeded. Please refresh."
    );
    comp.screenToShow = SignUpGetStarterBitcloutComponent.COMPLETED_PHONE_NUMBER_VERIFICATION_SCREEN;
    comp.submittingPhoneNumberVerificationCode = false;
    comp.phoneNumberVerified.emit();
  }
}

// Helper class
class SendPhoneNumberVerificationTextServerErrors {
  phoneNumberAlreadyInUse: boolean;
  maxSendAttemptsReached: boolean;
  voipNumberNotAllowed: boolean;
  chineseNumberNotAllowed: boolean;
}

// Helper class
class SubmitPhoneNumberVerificationCodeServerErrors {
  invalidCode: boolean;
  maxCheckAttemptsReached: boolean;
}
