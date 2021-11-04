import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { CountryISO } from "ngx-intl-tel-input";
import { Title } from "@angular/platform-browser";
import { ThemeService } from "../theme/theme.service";
import { environment } from "src/environments/environment";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import { Router } from "@angular/router";

@Component({
  selector: "settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit {
  loading = false;
  countryISO = CountryISO;
  emailAddress = "";
  invalidEmailEntered = false;
  updatingSettings = false;
  showSuccessMessage = false;
  successMessageTimeout: any;
  deletingPII = false;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    public themeService: ThemeService,
    private router: Router
  ) {}

  selectChangeHandler(event: any) {
    const newTheme = event.target.value;
    this.themeService.setTheme(newTheme);
  }

  ngOnInit() {
    this._getUserMetadata();
    this.titleService.setTitle(`Settings - ${environment.node.name}`);
  }

  _getUserMetadata() {
    this.loading = true;
    this.backendApi
      .GetUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/
      )
      .subscribe(
        (res) => {
          this.emailAddress = res.Email;
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loading = false;
      });
  }

  _validateEmail(email) {
    if (email === "" || this.globalVars.emailRegExp.test(email)) {
      this.invalidEmailEntered = false;
    } else {
      this.invalidEmailEntered = true;
    }
  }

  _updateSettings() {
    if (this.showSuccessMessage) {
      this.showSuccessMessage = false;
      clearTimeout(this.successMessageTimeout);
    }

    this.updatingSettings = true;
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
          console.log(err);
        }
      )
      .add(() => {
        this.showSuccessMessage = true;
        this.updatingSettings = false;
        this.successMessageTimeout = setTimeout(() => {
          this.showSuccessMessage = false;
        }, 500);
      });
  }

  deletePII() {
    SwalHelper.fire({
      target: GlobalVarsService.getTargetComponentSelectorFromRouter(this.router),
      icon: "warning",
      title: `Delete Your Personal Information`,
      html: `Clicking confirm will remove your phone number, email address, and any other personal information associated with your public key.`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.deletingPII = true;
        this.backendApi
          .DeletePII(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check)
          .subscribe(
            (res) => {
              this.globalVars._alertSuccess("PII Deleted successfully");
              this.emailAddress = "";
              this.globalVars.updateEverything();
            },
            (err) => {
              console.error(err);
              this.globalVars._alertError(err.error.error);
            }
          )
          .add(() => (this.deletingPII = false));
      }
    });
  }
}
