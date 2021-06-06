import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { CountryISO } from "ngx-intl-tel-input";
import { Title } from '@angular/platform-browser';
import { ThemeService } from '../theme/theme.service';

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

  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService, private titleService: Title, private themeService: ThemeService) {}

  ngOnInit() {
    this._getUserMetadata();
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

  // Set Title function for dynamically setting the title
  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }

  // Toggle Function for Themeing
  toggle() {
    const active = this.themeService.getActiveTheme() ;
    if (active.name === 'dark') {
      this.themeService.setTheme('light');
      localStorage.setItem('theme', 'light');
    } else {
      this.themeService.setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
}
