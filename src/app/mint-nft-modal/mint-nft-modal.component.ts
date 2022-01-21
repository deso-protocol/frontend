import { Component, Input } from "@angular/core";
import { BackendApiService, ProfileEntryResponse } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { BsModalService } from "ngx-bootstrap/modal";
import { Router } from "@angular/router";

type AdditionalRoyalty = {
  PublicKeyBase58Check?: string;
  Username?: string;
  ProfileEntryResponse?: ProfileEntryResponse;
  RoyaltyPercent: number;
};

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
  minBidAmountDESO: number = 0;
  creatorRoyaltyPercent: number = 5;
  coinRoyaltyPercent: number = 10;
  includeUnlockable: boolean = false;
  createNFTFeeNanos: number;
  maxCopiesPerNFT: number;
  buyNowPriceDESO: number = 0;
  buyNowPriceUSD: string = "0";
  isBuyNow: boolean = false;
  additionalDESORoyalties: AdditionalRoyalty[] = [];
  additionalCoinRoyalties: AdditionalRoyalty[] = [];

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

  hasUnreasonableTotalRoyalties(): boolean {
    let totalAdditionalRoyalties = 0;

    const sumReducer = (previousValue, currentValue) => previousValue + currentValue;

    totalAdditionalRoyalties = this.additionalCoinRoyalties.reduce(sumReducer, totalAdditionalRoyalties);
    totalAdditionalRoyalties = this.additionalDESORoyalties.reduce(sumReducer, totalAdditionalRoyalties);
    return this.creatorRoyaltyPercent + this.coinRoyaltyPercent + totalAdditionalRoyalties > 100;
  }

  hasUnreasonableRoyalties(): boolean {
    let isEitherUnreasonable =
      this.creatorRoyaltyPercent < 0 ||
      this.creatorRoyaltyPercent > 100 ||
      this.coinRoyaltyPercent < 0 ||
      this.coinRoyaltyPercent > 100;
    let isAnyAdditionalUnreasonable = false;
    let totalAdditionalRoyalties = 0;
    this.additionalCoinRoyalties.forEach((royalty) => {
      totalAdditionalRoyalties += royalty.RoyaltyPercent;
      if (royalty.RoyaltyPercent > 100 || royalty.RoyaltyPercent < 0) {
        isAnyAdditionalUnreasonable = true;
      }
    });
    this.additionalDESORoyalties.forEach((royalty) => {
      totalAdditionalRoyalties += royalty.RoyaltyPercent;
      if (royalty.RoyaltyPercent > 100 || royalty.RoyaltyPercent < 0) {
        isAnyAdditionalUnreasonable = true;
      }
    });

    let isSumUnreasonable = this.creatorRoyaltyPercent + this.coinRoyaltyPercent + totalAdditionalRoyalties > 100;
    return isEitherUnreasonable || isAnyAdditionalUnreasonable || isSumUnreasonable;
  }

  hasPostCreatorInAdditionalRoyalties(royalties: AdditionalRoyalty[]): boolean {
    return (
      royalties.filter((royalty) => royalty.PublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check)
        .length > 0
    );
  }

  hasDuplicatesInAdditionalRoyalties(royalties: AdditionalRoyalty[]): boolean {
    let royaltiesSet = new Set();
    return royalties.some((royalty) => {
      return royaltiesSet.size === royaltiesSet.add(royalty.PublicKeyBase58Check).size;
    });
  }

  isAdditionalDESORoyaltiesMissingPublicKey(): boolean {
    return this.additionalDESORoyalties.filter((royalty) => !royalty.PublicKeyBase58Check).length > 0;
  }

  isAdditionalCoinRoyaltiesMissingProfile(): boolean {
    return this.additionalCoinRoyalties.filter((royalty) => !royalty.Username).length > 0;
  }

  hasAdditionalRoyaltyError(): boolean {
    return (
      this.hasPostCreatorInAdditionalRoyalties(this.additionalCoinRoyalties) ||
      this.hasPostCreatorInAdditionalRoyalties(this.additionalDESORoyalties) ||
      this.hasDuplicatesInAdditionalRoyalties(this.additionalCoinRoyalties) ||
      this.hasDuplicatesInAdditionalRoyalties(this.additionalDESORoyalties) ||
      this.isAdditionalDESORoyaltiesMissingPublicKey() ||
      this.isAdditionalCoinRoyaltiesMissingProfile()
    );
  }

  hasUnreasonableNumCopies(): boolean {
    return this.numCopies > (this.maxCopiesPerNFT || 1000) || this.numCopies < 1;
  }

  hasUnreasonableMinBidAmount(): boolean {
    return parseFloat(this.minBidAmountUSD) < 0 || this.minBidAmountDESO < 0;
  }

  hasUnreasonableBuyNowPrice(): boolean {
    const buyNowPriceUSD = parseFloat(this.buyNowPriceUSD);
    return (
      this.isBuyNow &&
      (buyNowPriceUSD < parseFloat(this.minBidAmountUSD) ||
        buyNowPriceUSD < 0 ||
        this.buyNowPriceDESO < this.minBidAmountDESO ||
        this.buyNowPriceDESO < 0)
    );
  }

  updateOnSaleStatus(isOnSale: boolean): void {
    if (!isOnSale) {
      this.isBuyNow = false;
      this.buyNowPriceDESO = 0;
      this.buyNowPriceUSD = "0";
      this.minBidAmountDESO = 0;
      this.minBidAmountUSD = "0";
    }
  }

  updateBuyNowStatus(isBuyNow: boolean): void {
    if (!isBuyNow) {
      this.buyNowPriceDESO = 0;
      this.buyNowPriceUSD = "0";
    }
  }

  updateIncludeUnlockable(includeUnlockable: boolean): void {
    if (includeUnlockable) {
      this.isBuyNow = false;
      this.buyNowPriceDESO = 0;
      this.buyNowPriceUSD = "0";
    }
  }

  updateMinBidAmountUSD(desoAmount): void {
    this.minBidAmountUSD = this.globalVars.nanosToUSDNumber(desoAmount * 1e9).toFixed(2);
  }

  updateMinBidAmountDESO(usdAmount): void {
    this.minBidAmountDESO = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
  }

  updateBuyNowPriceUSD(desoAmount): void {
    this.buyNowPriceUSD = this.globalVars.nanosToUSDNumber(desoAmount * 1e9).toFixed(2);
  }

  updateBuyNowPriceDESO(usdAmount): void {
    this.buyNowPriceDESO = Math.trunc(this.globalVars.usdToNanosNumber(usdAmount)) / 1e9;
  }

  mintNft() {
    if (
      this.hasUnreasonableTotalRoyalties() ||
      this.hasUnreasonableNumCopies() ||
      this.hasUnreasonableMinBidAmount() ||
      this.hasUnreasonableBuyNowPrice() ||
      this.hasAdditionalRoyaltyError()
    ) {
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

    let additionalCoinRoyaltiesMap = this.additionalCoinRoyalties.reduce((royaltyMap, royalty) => {
      royaltyMap[royalty.PublicKeyBase58Check] = royalty.RoyaltyPercent * 100;
      return royaltyMap;
    }, {});

    let additionalDESORoyaltiesMap = this.additionalDESORoyalties.reduce((royaltyMap, royalty) => {
      royaltyMap[royalty.PublicKeyBase58Check] = royalty.RoyaltyPercent * 100;
      return royaltyMap;
    }, {});

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
        Math.trunc(this.minBidAmountDESO * 1e9),
        this.isBuyNow,
        Math.trunc(this.buyNowPriceDESO * 1e9),
        additionalDESORoyaltiesMap,
        additionalCoinRoyaltiesMap,
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

  addNewDESORoyalty(): void {
    this.additionalDESORoyalties.push({ RoyaltyPercent: 0 });
  }

  addNewCoinRoyalty(): void {
    this.additionalCoinRoyalties.push({ RoyaltyPercent: 0 });
  }

  resetRoyaltyUser(royalty: AdditionalRoyalty): void {
    royalty.Username = undefined;
    royalty.PublicKeyBase58Check = undefined;
    royalty.ProfileEntryResponse = undefined;
  }

  removeRoyalty(royalties: AdditionalRoyalty[], idx: number): void {
    if (royalties.length < idx) {
      return;
    }
    royalties.splice(idx, 1);
  }

  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse, royalties: AdditionalRoyalty[], idx: number): void {
    if (royalties.length < idx) {
      return;
    }
    royalties[idx].ProfileEntryResponse = creator;
    royalties[idx].PublicKeyBase58Check = creator.PublicKeyBase58Check;
    royalties[idx].Username = creator.Username;
  }
}
