import { Component, OnInit } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-nft-sold-modal',
  templateUrl: './nft-sold-modal.component.html',
})
export class NftSoldModalComponent implements OnInit {

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
