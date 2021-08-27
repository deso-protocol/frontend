import { Component, Input } from "@angular/core";
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { BsModalService } from "ngx-bootstrap/modal";
import { Router } from "@angular/router";

@Component({
  selector: "app-mint-nft-modal",
  templateUrl: "./mint-nft-modal.component.html",
})
export class MintNftModalComponent {
  IS_SINGLE_COPY = "isSingleCopy";
  IS_MULTIPLE_COPIES = "isMultipleCopies";
  @Input() post: any;

  globalVars: GlobalVarsService;
  minting = false;

  // Settings.
  copiesRadioValue = this.IS_SINGLE_COPY;
  numCopies: number = 1;
  putOnSale: boolean = true;
  minBidAmountUSD: string = "0";
  minBidAmountCLOUT: number = 0;
  creatorRoyaltyPercent: number = 5;
  coinRoyaltyPercent: number = 10;
  includeUnlockable: boolean = false;
  createNFTFeeNanos: number;
  maxCopiesPerNFT: number;

  // Errors.
  unreasonableRoyaltiesSet: boolean = false;
  unreasonableNumCopiesSet: boolean = false;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    private router: Router,
    public bsModalRef: BsModalRef
  ) {
    this.globalVars = _globalVars;
    this.backendApi
      .GetGlobalParams(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe((res) => {
        this.createNFTFeeNanos = res.CreateNFTFeeNanos;
        this.maxCopiesPerNFT = res.MaxCopiesPerNFT;
      });
  }

  hasUnreasonableRoyalties() {
    let isEitherUnreasonable =
      this.creatorRoyaltyPercent < 0 ||
      this.creatorRoyaltyPercent > 100 ||
      this.coinRoyaltyPercent < 0 ||
      this.coinRoyaltyPercent > 100;
    let isSumUnreasonable = this.creatorRoyaltyPercent + this.coinRoyaltyPercent > 100;
    return isEitherUnreasonable || isSumUnreasonable;
  }

  hasUnreasonableNumCopies() {
    return this.numCopies > (this.maxCopiesPerNFT || 1000) || this.numCopies < 1;
  }

  hasUnreasonableMinBidAmount() {
    return parseFloat(this.minBidAmountUSD) < 0 || this.minBidAmountCLOUT < 0;
  }

  updateMinBidAmountUSD(cloutAmount) {
    this.minBidAmountUSD = this.globalVars.nanosToUSDNumber(cloutAmount * 1e9).toFixed(2);
  }

  updateMinBidAmountCLOUT(usdAmount) {
    this.minBidAmountCLOUT = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
  }

  mintNft() {
    if (this.hasUnreasonableRoyalties() || this.hasUnreasonableNumCopies() || this.hasUnreasonableMinBidAmount()) {
      // It should not be possible to trigger this since the button is disabled w/these conditions.
      return;
    }

    let numCopiesToMint = this.numCopies;
    if (this.copiesRadioValue === this.IS_SINGLE_COPY) {
      numCopiesToMint = 1;
    }

    let creatorRoyaltyBasisPoints = 0;
    if (this.creatorRoyaltyPercent) {
      creatorRoyaltyBasisPoints = this.creatorRoyaltyPercent * 100;
    }

    let coinRoyaltyBasisPoints = 0;
    if (this.coinRoyaltyPercent) {
      coinRoyaltyBasisPoints = this.coinRoyaltyPercent * 100;
    }

    this.minting = true;
    this.backendApi
      .CreateNft(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.post.PostHashHex,
        numCopiesToMint,
        creatorRoyaltyBasisPoints,
        coinRoyaltyBasisPoints,
        this.includeUnlockable,
        this.putOnSale,
        Math.trunc(this.minBidAmountCLOUT * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.globalVars.updateEverything(res.TxnHashHex, this._mintNFTSuccess, this._mintNFTFailure, this);
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          this.minting = false;
        }
      );
  }

  _mintNFTSuccess(comp: MintNftModalComponent) {
    comp.minting = false;
    comp.router.navigate(["/" + comp.globalVars.RouteNames.NFT + "/" + comp.post.PostHashHex]);
    comp.bsModalRef.hide();
  }

  _mintNFTFailure(comp: MintNftModalComponent) {
    comp.minting = false;
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
  }
}
