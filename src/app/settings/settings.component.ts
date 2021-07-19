import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { CountryISO } from "ngx-intl-tel-input";
import { Title } from "@angular/platform-browser";
import { ThemeService } from "../theme/theme.service";

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

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private titleService: Title,
    public themeService: ThemeService
  ) {}

  selectChangeHandler(event: any) {
    const newTheme = event.target.value;
    this.themeService.setTheme(newTheme);
  }

  ngOnInit() {
    this._getUserMetadata();
    this.titleService.setTitle("Settings - BitClout");
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
}
