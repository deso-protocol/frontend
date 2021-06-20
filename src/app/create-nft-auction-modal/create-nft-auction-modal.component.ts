import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";

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
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit(): void {
  }

}
