import { Component, OnInit } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "bid-placed-modal",
  templateUrl: "./bid-placed-modal.component.html",
})
export class BidPlacedModalComponent {
  constructor(public bsModalRef: BsModalRef, public globalVars: GlobalVarsService) {}
}
