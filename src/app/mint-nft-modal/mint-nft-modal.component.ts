import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'app-mint-nft-modal',
  templateUrl: './mint-nft-modal.component.html',
})
export class MintNftModalComponent implements OnInit {
  @Input() postHashHex: string;
  loading = false;

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
