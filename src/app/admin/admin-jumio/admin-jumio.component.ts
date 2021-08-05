import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";

@Component({
  selector: "admin-jumio",
  templateUrl: "./admin-jumio.component.html",
  styleUrls: ["./admin-jumio.component.scss"],
})
export class AdminJumioComponent {
  usernameToFetchJumioAttempts = "";
  loadingJumioAttempts = false;
  jumioAttempts = null;

  usernameToResetJumio = "";
  resettingJumio = false;

  constructor(
    private globalVars: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {}

  _loadJumioAttempts(): void {
    this.loadingJumioAttempts = true;
    let pubKey = "";
    let username = "";
    if (this.globalVars.isMaybePublicKey(this.usernameToFetchJumioAttempts)) {
      pubKey = this.usernameToFetchJumioAttempts;
    } else {
      username = this.usernameToFetchJumioAttempts;
    }
    this.backendApi
      .AdminGetJumioAttemptsForPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username
      )
      .subscribe(
        (res) => {
          this.jumioAttempts = res.VerificationAttempts;
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.loadingJumioAttempts = false));
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
}
