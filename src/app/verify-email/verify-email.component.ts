import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "verify-email",
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const publicKey = params.publicKey;
      const emailHash = params.emailHash;

      this.backendApi.VerifyEmail(this.globalVars.localNode, publicKey, emailHash).subscribe(
        (res) => {
          this.globalVars._alertSuccess("Email verified successfully");
        },
        (err) => {
          this.globalVars._alertError("Failed to verify email: " + err.error.error);
        }
      );

      // This re-renders the sidebar
      this.globalVars.loggedInUser.EmailVerified = true;

      this.router.navigate(["/" + this.globalVars.RouteNames.BROWSE]);
    });
  }
}
