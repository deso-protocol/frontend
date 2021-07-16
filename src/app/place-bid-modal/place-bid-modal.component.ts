import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BidPlacedModalComponent } from "../bid-placed-modal/bid-placed-modal.component";
import {
  BackendApiService,
  NFTBidData,
  NFTBidEntryResponse,
  NFTEntryResponse,
  PostEntryResponse,
} from "../backend-api.service";
import * as _ from "lodash";
import { Router } from "@angular/router";
import { of } from "rxjs";
import { concatMap, last } from "rxjs/operators";

@Component({
  selector: "app-place-bid-modal",
  templateUrl: "./place-bid-modal.component.html",
})
export class PlaceBidModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  bidAmountCLOUT: number;
  bidAmountUSD: string;
  nftBidData: NFTBidData;
  selectedSerialNumbers: boolean[] = [];
  selectedSerialNumber: number = 0;
  availableCount: number;
  availableSerialNumbers: NFTEntryResponse[];
  biddableSerialNumbers: NFTEntryResponse[];
  highBid: number;
  lowBid: number;
  loading = true;
  isSelectingSerialNumber = false;
  saveSelectionDisabled = true;
  showSelectedSerialNumbers = false;
  selectAll: boolean = false;
  placingBids: boolean = false;
  bidAmountErrors: string;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.backendApi
      .GetNFTBidsForNFTPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex
      )
      .subscribe((res) => {
        this.nftBidData = res;
        this.availableSerialNumbers = this.nftBidData.NFTEntryResponses.filter(
          (nftEntryResponse) => nftEntryResponse.IsForSale
        ).sort((a, b) => a.SerialNumber - b.SerialNumber);
        // force selection of serial number 1 for 1-of-1 NFTs
        if (this.nftBidData.NFTEntryResponses.length === 1) {
          this.selectedSerialNumbers[this.nftBidData.NFTEntryResponses[0].SerialNumber] = true;
        } else {
          this.selectedSerialNumbers = new Array(this.nftBidData.PostEntryResponse.NumNFTCopies);
        }
        this.availableCount = this.availableSerialNumbers.length;
        this.biddableSerialNumbers = this.availableSerialNumbers.filter(
          (nftEntryResponse) =>
            nftEntryResponse.OwnerPublicKeyBase58Check !== this.globalVars.loggedInUser.PublicKeyBase58Check
        );
        this.highBid = this.getMaxBidAmountFromList(this.nftBidData.BidEntryResponses);
        this.lowBid = this.getMinBidAmountFromList(this.nftBidData.BidEntryResponses);
      })
      .add(() => (this.loading = false));
  }

  updateBidAmountUSD(cloutAmount) {
    this.bidAmountUSD = this.globalVars.nanosToUSDNumber(cloutAmount * 1e9).toFixed(2);
    this.setBidAmountErrors();
  }

  updateBidAmountCLOUT(usdAmount) {
    this.bidAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
    this.setBidAmountErrors();
  }

  setBidAmountErrors(): void {
    const bidAmountExceedsBalance = this.bidAmountCLOUT * 1e9 > this.globalVars.loggedInUser.BalanceNanos;
    const serialNumbersBelowMinBid = this.availableSerialNumbers.filter(
      (sn) => this.selectedSerialNumbers[sn.SerialNumber] && sn.MinBidAmountNanos > this.bidAmountCLOUT * 1e9
    );
    this.bidAmountErrors = bidAmountExceedsBalance
      ? `You do not have ${this.bidAmountCLOUT} $CLOUT to fulfill this bid.\n\n`
      : "";
    this.bidAmountErrors += serialNumbersBelowMinBid.length
      ? `Your bid of ${this.bidAmountCLOUT} does not meet the minimum bid requirement for the following serial numbers: ` + serialNumbersBelowMinBid
          .map((sn) => `#${sn.SerialNumber} (${this.globalVars.nanosToBitClout(sn.MinBidAmountNanos, 2)})`)
          .join(", ")
      : "";
  }

  getMaxBidAmountFromList(bidEntryResponses: NFTBidEntryResponse[]): number {
    return _.maxBy(bidEntryResponses, (bidEntryResponse) => bidEntryResponse.BidAmountNanos)?.BidAmountNanos;
  }

  getMinBidAmountFromList(bidEntryResponses: NFTBidEntryResponse[]): number {
    return _.minBy(bidEntryResponses, (bidEntryResponses) => bidEntryResponses.BidAmountNanos)?.BidAmountNanos;
  }

  placeBid() {
    this.placingBids = true;
    of(...this.selectedSerialNumbers.map((isSelected, index) => (isSelected ? index : -1)))
      .pipe(
        concatMap((val) => {
          if (val >= 0) {
            return this.backendApi.CreateNFTBid(
              this.globalVars.localNode,
              this.globalVars.loggedInUser.PublicKeyBase58Check,
              this.post.PostHashHex,
              val,
              Math.trunc(this.bidAmountCLOUT * 1e9),
              this.globalVars.defaultFeeRateNanosPerKB
            );
          } else {
            return of("");
          }
        })
      )
      .pipe(last((res) => res))
      .subscribe(
        (res) => {
          // Hide this modal and open the next one.
          this.bsModalRef.hide();
          this.modalService.show(BidPlacedModalComponent, {
            class: "modal-dialog-centered modal-sm",
          });
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      )
      .add(() => (this.placingBids = false));
  }

  navigateToBuyCLOUT(): void {
    this.bsModalRef.hide();
    this.router.navigate(["/" + this.globalVars.RouteNames.BUY_BITCLOUT]);
  }

  saveSelection(): void {
    if (!this.saveSelectionDisabled) {
      this.isSelectingSerialNumber = false;
      this.showSelectedSerialNumbers = true;
    }
  }

  toggleSelectAll(val: boolean) {
    this.saveSelectionDisabled = !val;
    this.availableSerialNumbers.forEach(
      (nftEntryResponse) => (this.selectedSerialNumbers[nftEntryResponse.SerialNumber] = val)
    );
  }

  checkSelectionStatus(val: boolean): void {
    let newSelectAll: boolean = true;
    let newSaveSelectionDisabled: boolean = true;
    for (let availableSerialNumber of this.availableSerialNumbers) {
      if (!this.selectedSerialNumbers[availableSerialNumber.SerialNumber]) {
        newSelectAll = false;
      } else {
        newSaveSelectionDisabled = false;
      }
    }
    this.selectAll = newSelectAll;
    this.saveSelectionDisabled = newSaveSelectionDisabled;
  }

  placeBidDisabled(): boolean {
    return (
      !this.selectedSerialNumbers.filter((selectedSerialNum) => selectedSerialNum).length ||
      !this.bidAmountCLOUT ||
      !!this.bidAmountErrors
    );
  }

  selectSerialNumber(idx: number) {
    this.saveSelectionDisabled = false;
    console.log(idx);
    console.log(this.selectedSerialNumbers);
    for (let i = 0; i < this.selectedSerialNumbers.length; i++) {
      console.log(i);
      this.selectedSerialNumbers[i] = i === idx;
    }
    console.log(this.selectedSerialNumbers);
    this.saveSelection();
  }

  deselectSerialNumber(idx: number) {
    this.selectedSerialNumbers[idx] = false;
    this.showSelectedSerialNumbers = !!this.selectedSerialNumbers.filter((val) => val).length;
  }
}
