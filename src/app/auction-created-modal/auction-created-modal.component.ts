import { Component } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "auction-created-modal",
  templateUrl: "./auction-created-modal.component.html",
})
export class AuctionCreatedModalComponent {
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService
  ) {}
}
