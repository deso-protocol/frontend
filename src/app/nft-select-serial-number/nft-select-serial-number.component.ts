import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, NFTEntryResponse } from "../backend-api.service";
import * as _ from "lodash";

@Component({
  selector: "nft-select-serial-number",
  templateUrl: "./nft-select-serial-number.component.html",
})
export class NftSelectSerialNumberComponent implements OnInit {
  static PAGE_SIZE = 50;
  static BUFFER_SIZE = 10;
  static WINDOW_VIEWPORT = false;
  static PADDING = 0.5;

  @Input() serialNumbers: NFTEntryResponse[];
  @Input() showBuyNow: boolean = false;
  @Input() postHashHex: string;
  @Output() serialNumberSelected = new EventEmitter<NFTEntryResponse>();
  @Output() nftPurchased = new EventEmitter();

  SN_FIELD = "SerialNumber";
  HIGH_BID_FIELD = "HighestBidAmountNanos";
  MIN_BID_FIELD = "MinBidAmountNanos";
  BUY_NOW_FIELD = "BuyNowPriceNanos";
  selectedSerialNumber: NFTEntryResponse = null;
  sortedSerialNumbers: NFTEntryResponse[];
  sortByField = this.SN_FIELD;
  sortByOrder: "desc" | "asc" = "desc";

  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  ngOnInit() {
    this.updateBidSort(this.SN_FIELD);
  }

  selectSerialNumber(idx: number) {
    this.selectedSerialNumber = this.serialNumbers.find((sn) => sn.SerialNumber === idx);
    this.serialNumberSelected.emit(this.selectedSerialNumber);
  }

  updateBidSort(sortField: string) {
    if (this.sortByField === sortField) {
      this.sortByOrder = this.sortByOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortByOrder = "asc";
    }
    this.sortByField = sortField;
    this.sortedSerialNumbers = _.orderBy(this.serialNumbers, [this.sortByField], [this.sortByOrder]);
  }

  buyNow(event, nft: NFTEntryResponse): void {
    event.stopPropagation();
    this.backendApi
      .CreateNFTBid(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.postHashHex,
        nft.SerialNumber,
        nft.BuyNowPriceNanos,
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe((res) => {
        this.nftPurchased.emit();
      });
  }
}
