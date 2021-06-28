import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { AuctionCreatedModalComponent } from "../auction-created-modal/auction-created-modal.component";

@Component({
  selector: 'app-select-serial-number-modal',
  templateUrl: './select-serial-number-modal.component.html',
})
export class SelectSerialNumberModalComponent implements OnInit {
  @Input() postHashHex: string;
  loading = false;
  sampleNftData = [
    {'SerialNumber': 1, 'NFTOwner': 'SamKolder', 'BidOwner':'SnoopKeeny', 'HighestBid': 0.15*1e9},
    {'SerialNumber': 2, 'NFTOwner': 'SamKolder', 'BidOwner':'RogerRev', 'HighestBid': 0.01*1e9},
    {'SerialNumber': 3, 'NFTOwner': 'SamKolder', 'BidOwner':'CharlyBloom', 'HighestBid': 0.04*1e9},
    {'SerialNumber': 4, 'NFTOwner': 'SamKolder', 'BidOwner':'SnoopKeeny', 'HighestBid': 0.20*1e9},
    {'SerialNumber': 5, 'NFTOwner': 'SamKolder', 'BidOwner':'JJBlue', 'HighestBid': 0.21*1e9},
    {'SerialNumber': 6, 'NFTOwner': 'SamKolder', 'BidOwner':'Exzavier', 'HighestBid': 0.22*1e9},
    {'SerialNumber': 7, 'NFTOwner': 'SamKolder', 'BidOwner':'Rodney', 'HighestBid': 0.23*1e9},
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
