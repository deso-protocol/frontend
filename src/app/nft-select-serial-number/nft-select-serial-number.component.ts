import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { NFTEntryResponse } from "../backend-api.service";
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
  @Output() serialNumberSelected = new EventEmitter<NFTEntryResponse>();

  SN_FIELD = "SerialNumber";
  HIGH_BID_FIELD = "HighestBidAmountNanos";
  MIN_BID_FIELD = "MinBidAmountNanos";
  selectedSerialNumber: NFTEntryResponse = null;
  sortedSerialNumbers: NFTEntryResponse[];
  sortByField = this.SN_FIELD;
  sortByOrder: "desc" | "asc" = "desc";

  constructor(public globalVars: GlobalVarsService) {}

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
}
