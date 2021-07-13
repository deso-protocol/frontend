import { Component, OnInit, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, NFTBidEntryResponse, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import * as _ from "lodash";
import { of } from "rxjs";
import { concatMap, last } from "rxjs/operators";
import { NftSoldModalComponent } from "../nft-sold-modal/nft-sold-modal.component";
import { AddUnlockableModalComponent } from "../add-unlockable-modal/add-unlockable-modal.component";

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
  sellingPrice = 2.0887;
  earnings = 1.3587;
  creatorRoyalty = 0.42;
  coinRoyalty = 0.21;
  serviceFee = 0.1;

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    private backendApi: BackendApiService,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit(): void {
    this.sellingPrice = _.sumBy(this.selectedBidEntries, "BidAmountNanos") / 1e9;
    const coinRoyaltyBasisPoints = this.post.NFTRoyaltyToCoinBasisPoints;
    const creatorRoyaltyBasisPoints = this.post.NFTRoyaltyToCreatorBasisPoints;

    this.creatorRoyalty = this.sellingPrice * (creatorRoyaltyBasisPoints / (100 * 100));
    this.coinRoyalty = this.sellingPrice * (coinRoyaltyBasisPoints / (100 * 100));
    this.earnings = this.sellingPrice - this.coinRoyalty - this.creatorRoyalty;

    console.log(this.selectedBidEntries);
  }

  sellNFT(): void {
    if (this.post.HasUnlockable) {
      this.modalService.show(AddUnlockableModalComponent, {
        class: "modal-dialog-centered",
        initialState: {
          post: this.post,
          selectedBidEntries: this.selectedBidEntries,
        },
      });
      this.bsModalRef.hide();
      return;
    }
    this.sellNFTDisabled = true;
    of(...this.selectedBidEntries)
      .pipe(
        concatMap((bidEntry) => {
          return this.backendApi.AcceptNFTBid(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.post.PostHashHex,
            bidEntry.SerialNumber,
            bidEntry.PublicKeyBase58Check,
            bidEntry.BidAmountNanos,
            "",
            this.globalVars.defaultFeeRateNanosPerKB
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
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      )
      .add(() => (this.sellNFTDisabled = false));
  }
}
