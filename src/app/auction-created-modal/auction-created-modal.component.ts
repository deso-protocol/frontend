import { Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-auction-created-modal',
  templateUrl: './auction-created-modal.component.html',
})
export class AuctionCreatedModalComponent implements OnInit {
  loading = false;

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
