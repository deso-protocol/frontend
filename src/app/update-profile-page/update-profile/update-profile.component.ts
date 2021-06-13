import { Component, OnInit, Input, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { RouteNames } from "../../app-routing.module";
import { Title } from "@angular/platform-browser";

export type ProfileUpdates = {
  usernameUpdate: string;
  descriptionUpdate: string;
  profilePicUpdate: string;
};

export type ProfileUpdateErrors = {
  usernameError: boolean;
  descriptionError: boolean;
  profilePicError: boolean;
  founderRewardError: boolean;
};

@Component({
  selector: "update-profile",
  templateUrl: "./update-profile.component.html",
  styleUrls: ["./update-profile.component.scss"],
})
export class UpdateProfileComponent implements OnInit, OnChanges {
  @Input() loggedInUser: any;
  updateProfileBeingCalled: boolean = false;
  usernameInput: string;
  descriptionInput: string;
  profilePicInput: string;
  founderRewardInput: number = 100;
  loggedInUserPublicKey = "";
  profileUpdates: ProfileUpdates = {
    usernameUpdate: "",
    descriptionUpdate: "",
    profilePicUpdate: "",
  };
  profileUpdateErrors: ProfileUpdateErrors = {
    usernameError: false,
    descriptionError: false,
    profilePicError: false,
    founderRewardError: false,
  };
  profileUpdated = false;

  constructor(
    public globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private router: Router,
    private titleService: Title
  ) {}

  ngOnInit() {
    this._updateFormBasedOnLoggedInUser();
    this.titleService.setTitle("Update Profile - BitClout");
  }

  // This is used to handle any changes to the loggedInUser elegantly.
  ngOnChanges(changes: any) {
    if (changes.loggedInUser) {
      // If there is no previousValue, we have just gotten the user so do an update.
      if (!changes.loggedInUser.previousValue) {
        this._updateFormBasedOnLoggedInUser();
      }
      // If there is a previousValue and it was a different user, update the form.
      else if (
        changes.loggedInUser.previousValue.PublicKeyBase58Check !=
        changes.loggedInUser.currentValue.PublicKeyBase58Check
      ) {
        this._updateFormBasedOnLoggedInUser();
      }
    }
  }

  founderRewardTooltip() {
    return (
      "When someone purchases your coin, a percentage is allocated to you as a 'founder reward'.\n\n" +
      "A FR of 0% means no value gets rewarded to you for each coin purchased, " +
      "whereas a FR of 100% means no one other than you gets the value because 100% goes to you.\n\n" +
      "Setting you FR too high will deter others from " +
      "buying your coin. Setting it too low risks automated bots profitting at your " +
      "expense. It's a balance, so be careful.\n\n" +
      "Please consider keeping your FR at 100% until you've " +
      "bought what you'd like of your own coin. After that, many in the community use a value of 10-20%."
    );
  }

  _updateFormBasedOnLoggedInUser() {
    if (this.globalVars.loggedInUser) {
      const profileEntryResponse = this.globalVars.loggedInUser.ProfileEntryResponse;
      this.usernameInput = profileEntryResponse?.Username || "";
      this.descriptionInput = profileEntryResponse?.Description || "";
      this.backendApi
        .GetSingleProfilePicture(
          this.globalVars.localNode,
          profileEntryResponse?.PublicKeyBase58Check,
          this.globalVars.profileUpdateTimestamp ? `?${this.globalVars.profileUpdateTimestamp}` : ""
        )
        .subscribe((res) => {
          this._readImageFileToProfilePicInput(res);
        });

      // If they don't have CreatorBasisPoints set, use the default.
      if (this.globalVars.loggedInUser.ProfileEntryResponse?.CoinEntry?.CreatorBasisPoints != null) {
        this.founderRewardInput = this.globalVars.loggedInUser.ProfileEntryResponse.CoinEntry.CreatorBasisPoints / 100;
      }
    }
  }

  _setProfileUpdates() {
    const profileEntryResponse = this.globalVars.loggedInUser.ProfileEntryResponse;
    this.profileUpdates.usernameUpdate =
      profileEntryResponse?.Username !== this.usernameInput ? this.usernameInput : "";
    this.profileUpdates.descriptionUpdate =
      profileEntryResponse?.Description !== this.descriptionInput ? this.descriptionInput : "";
    this.profileUpdates.profilePicUpdate =
      profileEntryResponse?.ProfilePic !== this.profilePicInput ? this.profilePicInput : "";
  }

  _setProfileErrors(): boolean {
    let hasErrors = false;
    if (this.usernameInput.length == 0) {
      this.profileUpdateErrors.usernameError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.usernameError = false;
    }

    if (this.descriptionInput.length > 180) {
      this.profileUpdateErrors.descriptionError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.descriptionError = false;
    }

    if (
      this.profilePicInput == null ||
      this.profilePicInput.length == 0 ||
      this.profilePicInput.length > 5 * 1024 * 1024 //
    ) {
      this.profileUpdateErrors.profilePicError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.profilePicError = false;
    }

    if (typeof this.founderRewardInput != "number" || this.founderRewardInput < 0 || this.founderRewardInput > 100) {
      this.profileUpdateErrors.founderRewardError = true;
      hasErrors = true;
    } else {
      this.profileUpdateErrors.founderRewardError = false;
    }

    return hasErrors;
  }

  // TODO: Kill NewStakeMultipleBasisPoints as an input to this endpoint in the backend.
  // TODO: Kill password as an input to this endpoint in the backend.
  //
  // This is a standalone function in case we decide we want to confirm fees before doing a real transaction.
  _callBackendUpdateProfile() {
    return this.backendApi.UpdateProfile(
      this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
      "" /*ProfilePublicKeyBase58Check*/,
      // Start params
      this.profileUpdates.usernameUpdate /*NewUsername*/,
      this.profileUpdates.descriptionUpdate /*NewDescription*/,
      this.profileUpdates.profilePicUpdate /*NewProfilePic*/,
      this.founderRewardInput * 1000 /*NewCreatorBasisPoints*/,
      1.25 * 100 * 100 /*NewStakeMultipleBasisPoints*/,
      false /*IsHidden*/,
      // End params
      this.globalVars.feeRateBitCloutPerKB * 1e9 /*MinFeeRateNanosPerKB*/
    );
  }

  _updateProfile() {
    // Trim the username input in case the user added a space at the end. Some mobile
    // browsers may do this.
    this.usernameInput = this.usernameInput.trim();

    const hasErrors = this._setProfileErrors();
    this.globalVars.logEvent("profile : update : error", this.profileUpdateErrors);
    if (hasErrors) {
      return;
    }

    this.updateProfileBeingCalled = true;
    this._setProfileUpdates();
    this._callBackendUpdateProfile().subscribe(
      (res) => {
        this.globalVars.profileUpdateTimestamp = Date.now();
        this.globalVars.logEvent("profile : update");
        // This updates things like the username that shows up in the dropdown.
        this.globalVars.updateEverything(res.TxnHashHex, this._updateProfileSuccess, this._updateProfileFailure, this);
      },
      (err) => {
        const parsedError = this.backendApi.parseProfileError(err);
        const lowBalance = parsedError.indexOf("insufficient");
        this.globalVars.logEvent("profile : update : error", { parsedError, lowBalance });
        this.updateProfileBeingCalled = false;
        SwalHelper.fire({
          icon: "error",
          title: `An Error Occurred`,
          html: parsedError,
          showConfirmButton: true,
          focusConfirm: true,
          customClass: {
            confirmButton: "btn btn-light",
            cancelButton: "btn btn-light no",
          },
          confirmButtonText: lowBalance ? "Buy $Bitclout" : null,
          cancelButtonText: lowBalance ? "Later" : null,
          showCancelButton: lowBalance,
        }).then((res) => {
          if (lowBalance && res.isConfirmed) {
            this.router.navigate([RouteNames.BUY_BITCLOUT], { queryParamsHandling: "merge" });
          }
        });
      }
    );
  }

  _updateProfileSuccess(comp: UpdateProfileComponent) {
    comp.updateProfileBeingCalled = false;
    comp.profileUpdated = true;
  }

  _updateProfileFailure(comp: UpdateProfileComponent) {
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
    comp.updateProfileBeingCalled = false;
  }

  _handleFileInput(files: FileList) {
    let fileToUpload = files.item(0);
    if (!fileToUpload.type || !fileToUpload.type.startsWith("image/")) {
      this.globalVars._alertError("File selected does not have an image file type.");
      return;
    }
    if (fileToUpload.size > 5 * 1024 * 1024) {
      this.globalVars._alertError("Please upload an image that is smaller than 5MB.");
      return;
    }
    this._readImageFileToProfilePicInput(fileToUpload);
  }

  _readImageFileToProfilePicInput(file: Blob | File) {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (event: any) => {
      const base64Image = btoa(event.target.result);
      this.profilePicInput = `data:${file.type};base64,${base64Image}`;
    };
  }

  _resetImage() {
    this.profilePicInput = "";
  }
}
