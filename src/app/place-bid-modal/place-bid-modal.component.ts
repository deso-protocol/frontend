import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BidPlacedModalComponent } from "../bid-placed-modal/bid-placed-modal.component";
import { BackendApiService, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import * as _ from "lodash";
import { Router } from "@angular/router";
import { isNumber } from "lodash";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "place-bid-modal",
  templateUrl: "./place-bid-modal.component.html",
})
export class PlaceBidModalComponent implements OnInit {
  static PAGE_SIZE = 50;
  static BUFFER_SIZE = 10;
  static WINDOW_VIEWPORT = false;
  static PADDING = 0.5;

  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  bidAmountCLOUT: number;
  bidAmountUSD: number;
  selectedSerialNumber: NFTEntryResponse = null;
  availableCount: number;
  availableSerialNumbers: NFTEntryResponse[];
  biddableSerialNumbers: NFTEntryResponse[];
  highBid: number = null;
  lowBid: number = null;
  loading = true;
  isSelectingSerialNumber = true;
  saveSelectionDisabled = false;
  showSelectedSerialNumbers = false;
  placingBids: boolean = false;
  errors: string[] = [];
  SN_FIELD = "SerialNumber";
  HIGH_BID_FIELD = "HighestBidAmountNanos";
  MIN_BID_FIELD = "MinBidAmountNanos";
  sortByField = this.SN_FIELD;
  sortByOrder: "desc" | "asc" = "asc";
  minBidCurrency: string = "USD";
  minBidInput: number = 0;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.backendApi
      .GetNFTCollectionSummary(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex
      )
      .subscribe((res) => {
        this.availableSerialNumbers = _.values(res.SerialNumberToNFTEntryResponse);
        this.availableCount = res.NFTCollectionResponse.PostEntryResponse.NumNFTCopiesForSale;
        this.biddableSerialNumbers = _.orderBy(
          this.availableSerialNumbers.filter(
            (nftEntryResponse) =>
              nftEntryResponse.OwnerPublicKeyBase58Check !== this.globalVars.loggedInUser.PublicKeyBase58Check
          ),
          [this.sortByField],
          [this.sortByOrder]
        );
      })
      .add(() => (this.loading = false));
  }

  updateBidAmountUSD(cloutAmount) {
    this.bidAmountUSD = parseFloat(this.globalVars.nanosToUSDNumber(cloutAmount * 1e9).toFixed(2));
    this.setErrors();
  }

  updateBidAmountCLOUT(usdAmount) {
    this.bidAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
    this.setErrors();
  }

  setErrors(): void {
    this.errors = [];
    if (this.bidAmountCLOUT * 1e9 > this.globalVars.loggedInUser.BalanceNanos) {
      this.errors.push(`You do not have ${this.bidAmountCLOUT} CLOUT to fulfill this bid.`);
    }
    if (this.bidAmountCLOUT * 1e9 === 0) {
      this.errors.push(`You must bid more than 0 CLOUT`);
    } else if (this.selectedSerialNumber?.MinBidAmountNanos > this.bidAmountCLOUT * 1e9) {
      this.errors.push(
        `Your bid does not meet the minimum bid requirement of ${this.globalVars.nanosToBitClout(
          this.selectedSerialNumber.MinBidAmountNanos
        )} CLOUT (${this.globalVars.nanosToUSD(this.selectedSerialNumber.MinBidAmountNanos, 2)})`
      );
    }
  }

  placeBid() {
    this.setErrors();
    if (this.errors.length) {
      return;
    }
    this.saveSelectionDisabled = true;
    this.placingBids = true;
    this.backendApi
      .CreateNFTBid(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex,
        this.selectedSerialNumber.SerialNumber,
        Math.trunc(this.bidAmountCLOUT * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          // Hide this modal and open the next one.
          this.bsModalRef.hide();
          this.modalService.setDismissReason("bid placed");
          this.showToast();
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      )
      .add(() => {
        this.placingBids = false;
        this.saveSelectionDisabled = false;
      });
  }

  navigateToBuyCLOUT(): void {
    this.bsModalRef.hide();
    this.router.navigate(["/" + this.globalVars.RouteNames.BUY_BITCLOUT]);
  }

  showToast(): void {
    const link = `/${this.globalVars.RouteNames.NFT}/${this.post.PostHashHex}`;
    this.toastr.show(`Bid placed<a href="${link}" class="toast-link cursor-pointer">View</a>`, null, {
      toastClass: "info-toast",
      enableHtml: true,
      positionClass: "toast-bottom-center",
    });
  }

  saveSelection(): void {
    if (!this.saveSelectionDisabled) {
      this.isSelectingSerialNumber = false;
      this.showSelectedSerialNumbers = true;
      this.highBid = this.selectedSerialNumber.HighestBidAmountNanos;
      this.lowBid = this.selectedSerialNumber.LowestBidAmountNanos;
      this.setErrors();
    }
  }

  selectSerialNumber(idx: number) {
    this.selectedSerialNumber = this.availableSerialNumbers.find((sn) => sn.SerialNumber === idx);
  }

  deselectSerialNumber() {
    if (this.placingBids) {
      return;
    }
    this.selectedSerialNumber = null;
    this.showSelectedSerialNumbers = false;
    this.highBid = null;
    this.lowBid = null;
    this.setErrors();
  }

  lastPage = null;

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    const startIdx = page * PlaceBidModalComponent.PAGE_SIZE;
    const endIdx = (page + 1) * PlaceBidModalComponent.PAGE_SIZE;

    return new Promise((resolve, reject) => {
      resolve(this.biddableSerialNumbers.slice(startIdx, Math.min(endIdx, this.biddableSerialNumbers.length)));
    });
  }

  updateBidSort(sortField: string) {
    if (this.sortByField === sortField) {
      this.sortByOrder = this.sortByOrder === "asc" ? "desc" : "asc";
    } else {
      this.sortByOrder = "asc";
    }
    this.sortByField = sortField;
    this.biddableSerialNumbers = _.orderBy(this.biddableSerialNumbers, [this.sortByField], [this.sortByOrder]);
  }

  bidAmountUSDFormatted() {
    return isNumber(this.bidAmountUSD) ? `~${this.globalVars.formatUSD(this.bidAmountUSD, 0)}` : "";
  }

  updateBidAmount(amount: number) {
    if (this.minBidCurrency === "CLOUT") {
      this.bidAmountCLOUT = amount;
      this.updateBidAmountUSD(amount);
    } else {
      this.bidAmountUSD = amount;
      this.updateBidAmountCLOUT(amount);
    }
  }
}
