import { Component, Input } from "@angular/core";
import { BackendApiService } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { isNumber } from "lodash";
import { Location } from "@angular/common";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-mint-nft-modal",
  templateUrl: "./mint-nft.component.html",
})
export class MintNftComponent {
  IS_SINGLE_COPY = "isSingleCopy";
  IS_MULTIPLE_COPIES = "isMultipleCopies";
  postHashHex: string;
  globalVars: GlobalVarsService;
  minting = false;

  // Settings.
  copiesRadioValue = this.IS_SINGLE_COPY;
  numCopies: number = 1;
  putOnSale: boolean = true;
  minBidInput: number = 0;
  minBidAmountUSD: number = 0;
  minBidAmountDESO: number = 0;
  creatorRoyaltyPercent: number = 5;
  coinRoyaltyPercent: number = 10;
  includeUnlockable: boolean = false;
  createNFTFeeNanos: number;
  maxCopiesPerNFT: number;
  // Whether the user is using USD or DESO to define the minimum bid
  minBidCurrency: string = "USD";

  // Errors.
  unreasonableRoyaltiesSet: boolean = false;
  unreasonableNumCopiesSet: boolean = false;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private router: Router,
    public location: Location,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    this.route.params.subscribe((params) => {
      this.postHashHex = params.postHashHex;
    });
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
    return this.minBidAmountUSD < 0 || this.minBidAmountDESO < 0;
  }

  updateMinBidAmountUSD(desoAmount) {
    this.minBidAmountUSD = parseFloat(this.globalVars.nanosToUSDNumber(desoAmount * 1e9).toFixed(2));
  }

  minBidAmountUSDFormatted() {
    return isNumber(this.minBidAmountUSD) ? `~${this.globalVars.formatUSD(this.minBidAmountUSD, 0)}` : "";
  }

  updateMinBidAmountDESO(usdAmount) {
    this.minBidAmountDESO = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
  }

  updateMinBidAmount(amount: number) {
    if (this.minBidCurrency === "DESO") {
      this.minBidAmountDESO = amount;
      this.updateMinBidAmountUSD(amount);
    } else {
      this.minBidAmountUSD = amount;
      this.updateMinBidAmountDESO(amount);
    }
  }

  priceSectionTitle() {
    return this.copiesRadioValue === this.IS_SINGLE_COPY ? "Price" : "Number of copies and price";
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
        this.postHashHex,
        numCopiesToMint,
        creatorRoyaltyBasisPoints,
        coinRoyaltyBasisPoints,
        this.includeUnlockable,
        this.putOnSale,
        Math.trunc(this.minBidAmountDESO * 1e9),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          const link = `/${this.globalVars.RouteNames.NFT}/${this.postHashHex}`;
          this.globalVars.updateEverything(res.TxnHashHex, this._mintNFTSuccess, this._mintNFTFailure, this);
          this.toastr.show(`NFT Created<a href="${link}" class="toast-link cursor-pointer">View</a>`, null, {
            toastClass: "info-toast",
            enableHtml: true,
            positionClass: "toast-bottom-center",
          });
          this.router.navigate(["/" + this.globalVars.RouteNames.NFT + "/" + this.postHashHex], { queryParamsHandling: "merge" });
        },
        (err) => {
          this.globalVars._alertError(err.error.error);
          this.minting = false;
        }
      );
  }

  _mintNFTSuccess(comp: MintNftComponent) {
    comp.minting = false;
  }

  _mintNFTFailure(comp: MintNftComponent) {
    comp.minting = false;
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
  }
}
