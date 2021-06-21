import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { AuctionCreatedModalComponent } from "../auction-created-modal/auction-created-modal.component";

@Component({
  selector: 'app-create-nft-auction',
  templateUrl: './create-nft-auction-modal.component.html',
})
export class CreateNftAuctionModalComponent implements OnInit {
  @Input() postHashHex: string;
  loading = false;
  sampleNftData = [
    {"SerialNumber": 1, "LastPrice": 0.15*1e9},
    {"SerialNumber": 2, "LastPrice": 0.01*1e9},
    {"SerialNumber": 3, "LastPrice": 0.04*1e9},
    {"SerialNumber": 4, "LastPrice": 0.20*1e9},
    {"SerialNumber": 5, "LastPrice": 0.21*1e9},
    {"SerialNumber": 6, "LastPrice": 0.22*1e9},
    {"SerialNumber": 7, "LastPrice": 0.23*1e9},
  ]

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

  createAuction() {
    // Hide this modal and open the next one.
    this.bsModalRef.hide();
    this.modalService.show(AuctionCreatedModalComponent, {
      class: "modal-dialog-centered modal-sm",
    });
  }
}
