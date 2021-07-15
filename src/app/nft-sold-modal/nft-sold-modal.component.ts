import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "nft-sold-modal",
  templateUrl: "./nft-sold-modal.component.html",
})
export class NftSoldModalComponent {
  constructor(public bsModalRef: BsModalRef, private globalVars: GlobalVarsService, private router: Router) {}

  viewMyNFTs(): void {
    this.bsModalRef.hide();

    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, this.globalVars.loggedInUser.ProfileEntryResponse?.Username],
      {
        queryParams: { tab: "nfts" },
      }
    );
  }
}
