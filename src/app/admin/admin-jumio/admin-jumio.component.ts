import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

@Component({
  selector: "admin-jumio",
  templateUrl: "./admin-jumio.component.html",
  styleUrls: ["./admin-jumio.component.scss"],
})
export class AdminJumioComponent {
  usernameToResetJumio = "";
  resettingJumio = false;

  jumioBitCloutNanos: number = 0;
  updatingJumioBitCloutNanos = false;

  constructor(
    private globalVars: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.jumioBitCloutNanos = globalVars.jumioBitCloutNanos;
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
        (res) => {},
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.resettingJumio = false));
  }

  updateJumioBitCloutNanos(): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `You are about to update the amount of $CLOUT sent for verifying with Jumio to ${this.globalVars.nanosToBitClout(
        this.jumioBitCloutNanos
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
        this.updatingJumioBitCloutNanos = true;
        this.backendApi
          .AdminUpdateJumioBitClout(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.jumioBitCloutNanos
          )
          .subscribe(
            (res) => {
              this.globalVars.jumioBitCloutNanos = res.BitCloutNanos;
            },
            (err) => {
              console.error(err);
            }
          )
          .add(() => (this.updatingJumioBitCloutNanos = false));
      }
    });
  }
}
