import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BidPlacedModalComponent } from "../bid-placed-modal/bid-placed-modal.component";
import { BackendApiService, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import * as _ from "lodash";
import { Router } from "@angular/router";
import { filter, take } from "rxjs/operators";

@Component({
  selector: "place-bid-modal",
  templateUrl: "./place-bid-modal.component.html",
})
export class PlaceBidModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  bidAmountCLOUT: number;
  bidAmountUSD: string;
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
  errors: string;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.backendApi
      .GetNFTCollectionSummary(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex
      )
      .subscribe((res) => {
        this.availableSerialNumbers = _.values(res.SerialNumberToNFTEntryResponse).sort(
          (a, b) => a.SerialNumber - b.SerialNumber
        );
        this.availableCount = this.availableSerialNumbers.length;
        this.biddableSerialNumbers = this.availableSerialNumbers.filter(
          (nftEntryResponse) =>
            nftEntryResponse.OwnerPublicKeyBase58Check !== this.globalVars.loggedInUser.PublicKeyBase58Check
        );
        this.highBid = res.NFTCollectionResponse.HighestBidAmountNanos;
        this.lowBid = res.NFTCollectionResponse.LowestBidAmountNanos;
      })
      .add(() => (this.loading = false));
  }

  updateBidAmountUSD(cloutAmount) {
    this.bidAmountUSD = this.globalVars.nanosToUSDNumber(cloutAmount * 1e9).toFixed(2);
    this.setErrors();
  }

  updateBidAmountCLOUT(usdAmount) {
    this.bidAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
    this.setErrors();
  }

  setErrors(): void {
    const bidAmountExceedsBalance = this.bidAmountCLOUT * 1e9 > this.globalVars.loggedInUser.BalanceNanos;
    this.errors = !this.bidAmountCLOUT ? "You must bid more than 0 $CLOUT.\n\n" : "";
    this.errors += !this.selectedSerialNumber ? "You must select a serial number to bid.\n\n" : "";
    this.errors += bidAmountExceedsBalance
      ? `You do not have ${this.bidAmountCLOUT} $CLOUT to fulfill this bid.\n\n`
      : "";
    this.errors +=
      this.selectedSerialNumber.MinBidAmountNanos > this.bidAmountCLOUT * 1e9
        ? `Your bid of ${this.bidAmountCLOUT} does not meet the minimum bid requirement of ${this.selectedSerialNumber.MinBidAmountNanos}`
        : "";
  }

  placeBid() {
    this.setErrors();
    if (this.errors) {
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
          const modalRef = this.modalService.show(BidPlacedModalComponent, {
            class: "modal-dialog-centered modal-sm",
          });
          modalRef.onHide
            .pipe(
              take(1),
              filter((reason) => {
                return reason !== "explore";
              })
            )
            .subscribe(() => {
              window.location.reload();
            });
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

  saveSelection(): void {
    if (!this.saveSelectionDisabled) {
      this.isSelectingSerialNumber = false;
      this.showSelectedSerialNumbers = true;
    }
  }

  selectSerialNumber(idx: number) {
    this.selectedSerialNumber = this.availableSerialNumbers.find((sn) => sn.SerialNumber === idx);
    this.saveSelection();
  }

  deselectSerialNumber() {
    if (this.placingBids) {
      return;
    }
    this.selectedSerialNumber = null;
    this.showSelectedSerialNumbers = false;
    this.setErrors();
  }
}
