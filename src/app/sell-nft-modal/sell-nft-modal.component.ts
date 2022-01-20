import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, NFTBidEntryResponse, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import * as _ from "lodash";
import { of } from "rxjs";
import { concatMap, filter, last, map, take } from "rxjs/operators";
import { NftSoldModalComponent } from "../nft-sold-modal/nft-sold-modal.component";
import { AddUnlockableModalComponent } from "../add-unlockable-modal/add-unlockable-modal.component";
import { Router } from "@angular/router";

@Component({
  selector: "sell-nft-modal",
  templateUrl: "./sell-nft-modal.component.html",
})
export class SellNftModalComponent implements OnInit {
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;
  @Input() nftEntries: NFTEntryResponse[];
  @Input() selectedBidEntries: NFTBidEntryResponse[];
  loading = false;
  sellNFTDisabled = false;
  sellingPrice = 0;
  earnings = 0;
  creatorRoyalty = 0;
  additionalCreatorRoyalty = 0;
  coinRoyalty = 0;
  additionalCoinRoyalty = 0;
  serviceFee = 0;
  sellingNFT = false;

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    private backendApi: BackendApiService,
    public bsModalRef: BsModalRef,
    private router: Router
  ) {}

  // TODO: compute service fee.
  ngOnInit(): void {
    this.sellingPrice = _.sumBy(this.selectedBidEntries, "BidAmountNanos") / 1e9;
    const coinRoyaltyBasisPoints = this.post.NFTRoyaltyToCoinBasisPoints;
    const creatorRoyaltyBasisPoints = this.post.NFTRoyaltyToCreatorBasisPoints;
    const additionalCoinRoyaltyBasisPoints = Object.values(this.post.AdditionalCoinRoyaltiesMap || {}).reduce(
      (acc, val) => acc + val,
      0
    );
    const additionalCreatorRoyaltyBasisPoitns = Object.values(this.post.AdditionalDESORoyaltiesMap || {}).reduce(
      (acc, val) => acc + val,
      0
    );
    this.creatorRoyalty = this.sellingPrice * (creatorRoyaltyBasisPoints / (100 * 100));
    this.additionalCreatorRoyalty = this.sellingPrice * (additionalCreatorRoyaltyBasisPoitns / (100 * 100));
    this.coinRoyalty = this.sellingPrice * (coinRoyaltyBasisPoints / (100 * 100));
    this.additionalCoinRoyalty = this.sellingPrice * (additionalCoinRoyaltyBasisPoints / (100 * 100));
    this.earnings =
      this.sellingPrice -
      this.coinRoyalty -
      this.creatorRoyalty -
      this.additionalCreatorRoyalty -
      this.additionalCoinRoyalty;
  }

  sellNFTTotal: number;
  sellNFTCounter: number = 0;

  sellNFT(): void {
    if (this.post.HasUnlockable) {
      this.modalService.setDismissReason("unlockable content opened");
      this.bsModalRef.hide();
      return;
    }
    this.sellNFTTotal = this.selectedBidEntries.length;
    this.sellNFTDisabled = true;
    this.sellingNFT = true;
    of(...this.selectedBidEntries)
      .pipe(
        concatMap((bidEntry) => {
          return this.backendApi
            .AcceptNFTBid(
              this.globalVars.localNode,
              this.globalVars.loggedInUser.PublicKeyBase58Check,
              this.post.PostHashHex,
              bidEntry.SerialNumber,
              bidEntry.PublicKeyBase58Check,
              bidEntry.BidAmountNanos,
              "",
              this.globalVars.defaultFeeRateNanosPerKB
            )
            .pipe(
              map((res) => {
                this.sellNFTCounter++;
                return res;
              })
            );
        })
      )
      .pipe(last((res) => res))
      .subscribe(
        (res) => {
          // Hide this modal and open the next one.
          this.bsModalRef.hide();
          this.modalService.show(NftSoldModalComponent, {
            class: "modal-dialog-centered modal-sm",
          });
          this.modalService.setDismissReason("nft sold");
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      )
      .add(() => {
        this.sellNFTDisabled = false;
        this.sellingNFT = false;
      });
  }

  remove(bidEntry: NFTBidEntryResponse): void {
    this.selectedBidEntries = this.selectedBidEntries.filter((selectedEntry) => selectedEntry !== bidEntry);
  }

  navigateToProfile(bidEntry: NFTBidEntryResponse): void {
    if (!bidEntry.ProfileEntryResponse?.Username) {
      return;
    }
    this.bsModalRef.hide();
    this.router.navigate(["/" + this.globalVars.RouteNames.USER_PREFIX, bidEntry.ProfileEntryResponse.Username], {
      queryParamsHandling: "merge",
    });
  }
}
