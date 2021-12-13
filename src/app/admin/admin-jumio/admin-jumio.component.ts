import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, CountryLevelSignUpBonus, CountryLevelSignUpBonusResponse } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { AdminJumioEditCountrySignUpBonusComponent } from "./admin-jumio-edit-country-sign-up-bonus/admin-jumio-edit-country-sign-up-bonus.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";

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
  jumioCallbackCountrySelected: string = "";

  jumioUSD: number = 0;
  updatingJumioUSDCents = false;

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
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private toastr: ToastrService
  ) {
    this.jumioUSD = globalVars.jumioUSDCents / 100;
    this.refreshCountryBonuses();
  }

  refreshCountryBonuses(): Subscription {
    return this.backendApi
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
        username,
        this.jumioCallbackCountrySelected
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

  updateJumioUSDCents(): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `You are about to update the default sign-up amount sent for verifying with Jumio to ${this.globalVars.formatUSD(
        this.jumioUSD,
        2
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
        this.updatingJumioUSDCents = true;
        this.backendApi
          .AdminUpdateJumioUSDCents(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.jumioUSD * 100
          )
          .subscribe(
            (res) => {
              this.globalVars.jumioUSDCents = res.USDCents;
            },
            (err) => {
              console.error(err);
            }
          )
          .add(() => (this.updatingJumioUSDCents = false));
      }
    });
  }

  _handleTabClick(tab: string): void {
    this.activeTab = tab;
  }

  editCountry(country: string, event): void {
    event.stopPropagation();
    const editBonusModal = this.modalService.show(AdminJumioEditCountrySignUpBonusComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: { countryLevelSignUpBonusResponse: this.countryLevelSignUpBonuses[country] },
    });
    editBonusModal.onHide.subscribe((res) => {
      if (res === "sign-up-bonus-updated") {
        this.refreshCountryBonuses();
        this.toastr.info(`Sign-Up Bonus updated for ${country}`, null, { positionClass: "toast-top-center", timeOut: 3000 });
      }
    });
  }
}
