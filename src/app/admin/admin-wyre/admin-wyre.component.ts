import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";

@Component({
  selector: "admin-wyre",
  templateUrl: "./admin-wyre.component.html",
  styleUrls: ["./admin-wyre.component.scss"],
})
export class AdminWyreComponent {
  usernameToFetchWyreOrders = "";
  loadingWyreOrders = false;
  wyreOrders = null;

  constructor(
    private globalVars: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {}

  _loadWyreOrders(): void {
    this.loadingWyreOrders = true;
    let pubKey = "";
    let username = "";
    if (this.globalVars.isMaybePublicKey(this.usernameToFetchWyreOrders)) {
      pubKey = this.usernameToFetchWyreOrders;
    } else {
      username = this.usernameToFetchWyreOrders;
    }
    this.backendApi
      .GetWyreWalletOrderForPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username
      )
      .subscribe(
        (res) => {
          this.wyreOrders = res.WyreWalletOrderMetadataResponses;
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
        }
      )
      .add(() => (this.loadingWyreOrders = false));
  }
}
