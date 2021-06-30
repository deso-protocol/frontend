import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: 'app-sell-nft-modal',
  templateUrl: './sell-nft-modal.component.html',
})
export class SellNftModalComponent implements OnInit {
  @Input() postHashHex: string;
  loading = false;
  sellingPrice = 2.0887;
  earnings = 1.3587;
  creatorRoyalty = 0.42;
  coinRoyalty = 0.21;
  serviceFee = 0.1;

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }
}
