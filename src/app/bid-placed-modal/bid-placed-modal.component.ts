import { Component, OnDestroy, OnInit } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "bid-placed-modal",
  templateUrl: "./bid-placed-modal.component.html",
})
export class BidPlacedModalComponent implements OnInit, OnDestroy {
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService
  ) {}
  //
  // ngBeforeDestroy() {
  //
  // }

  ngOnDestroy() {
    this.modalService.setDismissReason("reload");
  }

  ngOnInit() {
    // this.modalService.setDismissReason("reload");
    // this.modalService.onHide.subscribe(() => this.modalService.setDismissReason("reload"));
  }

  onExploreClicked() {
    this.globalVars.exploreMarketplace(this.bsModalRef, this.modalService);
  }
}
