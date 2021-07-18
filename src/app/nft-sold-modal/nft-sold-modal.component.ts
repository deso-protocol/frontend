import { Component } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";

@Component({
  selector: "nft-sold-modal",
  templateUrl: "./nft-sold-modal.component.html",
})
export class NftSoldModalComponent {
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    private globalVars: GlobalVarsService,
    private router: Router
  ) {}

  viewMyNFTs(): void {
    this.modalService.setDismissReason("view_my_nfts");
    this.bsModalRef.hide();
    this.router.navigate(
      ["/" + this.globalVars.RouteNames.USER_PREFIX, this.globalVars.loggedInUser.ProfileEntryResponse?.Username],
      {
        queryParams: { tab: "nfts" },
      }
    );
  }
}
