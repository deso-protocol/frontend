import { Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-close-nft-auction-modal',
  templateUrl: './close-nft-auction-modal.component.html',
})
export class CloseNftAuctionModalComponent implements OnInit {

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
