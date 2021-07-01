import { Component, OnInit, Input } from '@angular/core';
import { BackendApiService, BackendRoutes } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { BsModalService } from "ngx-bootstrap/modal";
import { BidPlacedModalComponent } from "../bid-placed-modal/bid-placed-modal.component";

@Component({
  selector: 'app-mint-nft-modal',
  templateUrl: './mint-nft-modal.component.html',
})
export class MintNftModalComponent implements OnInit {
  IS_SINGLE_COPY = "isSingleCopy"
  IS_MULTIPLE_COPIES = "isMultipleCopies"
  @Input() post: any;

  globalVars: GlobalVarsService;
  minting = false;
  successfulMinting = false;
  failedMinting = false;

  // Settings.
  copiesRadioValue = this.IS_SINGLE_COPY;
  numCopies: number = 1;
  putOnSale: boolean = true;
  minBidAmountUSD: number = 0;
  minBidAmountCLOUT: number = 0;
  creatorRoyaltyPercent: number;
  coinRoyaltyPercent: number;
  includeUnlockable: boolean = false; 

  // Errors.
  unreasonableRoyaltiesSet: boolean = false;
  unreasonableNumCopiesSet: boolean = false;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private modalService: BsModalService,
    public bsModalRef: BsModalRef
  ) {
    this.globalVars = _globalVars;
  }

  ngOnInit(): void {
  }

  hasUnreasonableRoyalties() {
    let isEitherUnreasonable = (
      this.creatorRoyaltyPercent < 0 || this.creatorRoyaltyPercent > 100
    ) || (
      this.coinRoyaltyPercent < 0 || this.coinRoyaltyPercent > 100
    )
    let isSumUnreasonable = this.creatorRoyaltyPercent + this.coinRoyaltyPercent > 100;
    return isEitherUnreasonable || isSumUnreasonable
  }

  hasUnreasonableNumCopies() {
    return this.numCopies > 1000 || this.numCopies < 1
  }

  hasUnreasonableMinBidAmount() {
    return this.minBidAmountUSD < 0 || this.minBidAmountCLOUT < 0
  }

  updateMinBidAmountUSD(cloutAmount) {
    this.minBidAmountUSD = this.globalVars.nanosToUSDNumber(cloutAmount * 1e9)
  }

  updateMinBidAmountCLOUT(usdAmount) {
    this.minBidAmountCLOUT = this.globalVars.usdToNanosNumber(usdAmount) / 1e9
  }

  mintNft() {
    if(this.hasUnreasonableRoyalties() 
      || this.hasUnreasonableNumCopies() 
      || this.hasUnreasonableMinBidAmount()) {
      // It should not be possible to trigger this since the button is disabled w/these conditions.
      return
    }

    let numCopiesToMint = this.numCopies;
    if(this.copiesRadioValue === this.IS_SINGLE_COPY) {
      numCopiesToMint = 1;
    }

    let creatorRoyaltyBasisPoints = 0;
    if(this.creatorRoyaltyPercent) {
      creatorRoyaltyBasisPoints = this.creatorRoyaltyPercent * 100;
    }

    let coinRoyaltyBasisPoints = 0;
    if(this.coinRoyaltyPercent) {
      coinRoyaltyBasisPoints = this.coinRoyaltyPercent * 100;
    }

    this.minting = true;
    this.backendApi.CreateNft(
      this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check,
      this.post.PostHashHex,
      numCopiesToMint,
      creatorRoyaltyBasisPoints,
      coinRoyaltyBasisPoints,
      this.includeUnlockable,
      this.putOnSale,
      this.minBidAmountCLOUT * 1e9,
      this.globalVars.defaultFeeRateNanosPerKB,
    ).subscribe(
      (res) => {
        console.log('success')
        this.successfulMinting = true;
      },
      (err) => {
        console.log('failure')
        this.failedMinting = true;
      }
    ).add(() => {
      this.minting = false;
    })
  }
}
