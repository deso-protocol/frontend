import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import {BackendApiService, CountryLevelSignUpBonus, CountryLevelSignUpBonusResponse} from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

@Component({
  selector: "admin-jumio",
  templateUrl: "./admin-jumio.component.html",
  styleUrls: ["./admin-jumio.component.scss"],
})
export class AdminJumioComponent {
  usernameToResetJumio = "";
  usernameToExecuteJumioCallback = "";
  resettingJumio = false;
  executingJumioCallback = false;

  jumioDeSoNanos: number = 0;
  updatingJumioDeSoNanos = false;

  countryLevelSignUpBonuses: { [k: string]: CountryLevelSignUpBonusResponse } = {};
  defaultSignUpBonus: CountryLevelSignUpBonus;

  static GENERAL = "General";
  static COUNTRY_BONUSES = "Country Bonuses";
  tabs = [AdminJumioComponent.GENERAL, AdminJumioComponent.COUNTRY_BONUSES];
  activeTab: string = AdminJumioComponent.GENERAL;
  AdminJumioComponent = AdminJumioComponent;

  constructor(
    private globalVars: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.jumioDeSoNanos = globalVars.jumioDeSoNanos;
    backendApi
      .AdminGetAllCountryLevelSignUpBonuses(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res) => {
          this.countryLevelSignUpBonuses = res.SignUpBonusMetadata;
          this.defaultSignUpBonus = res.DefaultSignUpBonusMetadata;
        },
        (err) => {
          console.error(err);
        }
      );
  }

  _resetJumio(): void {
    this.resettingJumio = true;
    let pubKey = "";
    let username = "";
    if (this.globalVars.isMaybePublicKey(this.usernameToResetJumio)) {
      pubKey = this.usernameToResetJumio;
    } else {
      username = this.usernameToResetJumio;
    }
    this.backendApi
      .AdminResetJumioAttemptsForPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username
      )
      .subscribe(
        (res) => {
          this.globalVars._alertSuccess("Successfully reset jumio status");
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.resettingJumio = false));
  }

  _executeJumioCallback(): void {
    this.executingJumioCallback = true;
    let pubKey = "";
    let username = "";
    if (this.globalVars.isMaybePublicKey(this.usernameToExecuteJumioCallback)) {
      pubKey = this.usernameToExecuteJumioCallback;
    } else {
      username = this.usernameToExecuteJumioCallback;
    }
    this.backendApi
      .AdminJumioCallback(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username
      )
      .subscribe(
        (res) => {
          this.globalVars._alertSuccess("Successfully executed jumio callback");
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.executingJumioCallback = false));
  }

  updateJumioDeSoNanos(): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `You are about to update the amount of $DESO sent for verifying with Jumio to ${this.globalVars.nanosToDeSo(
        this.jumioDeSoNanos
      )}.`,
      showConfirmButton: true,
      showCancelButton: true,
      reverseButtons: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Ok",
      cancelButtonText: "Cancel",
    }).then((res) => {
      if (res.isConfirmed) {
        this.updatingJumioDeSoNanos = true;
        this.backendApi
          .AdminUpdateJumioDeSo(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.jumioDeSoNanos
          )
          .subscribe(
            (res) => {
              this.globalVars.jumioDeSoNanos = res.DeSoNanos;
            },
            (err) => {
              console.error(err);
            }
          )
          .add(() => (this.updatingJumioDeSoNanos = false));
      }
    });
  }

  _handleTabClick(tab: string): void {
    this.activeTab = tab;
  }

  editCountry(countryCode: string): void {
    console.log(countryCode);
  }
}
