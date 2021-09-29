import { Component, Input, OnInit } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { of } from "rxjs";
import { concatMap, last, map } from "rxjs/operators";
import { BackendApiService, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "close-nft-auction-modal",
  templateUrl: "./close-nft-auction-modal.component.html",
})
export class CloseNftAuctionModalComponent {
  @Input() post: PostEntryResponse;
  @Input() myAvailableSerialNumbers: NFTEntryResponse[];

  closingAuction: boolean = false;

  constructor(
    public bsModalRef: BsModalRef,
    private modalService: BsModalService,
    private backendApi: BackendApiService,
    private globalVars: GlobalVarsService
  ) {}

  auctionTotal: number;
  auctionCounter: number = 0;
  closeAuction(): void {
    this.closingAuction = true;
    this.auctionTotal = this.myAvailableSerialNumbers.length;
    of(...this.myAvailableSerialNumbers)
      .pipe(
        concatMap((nftEntry) => {
          return this.backendApi
            .UpdateNFT(
              this.globalVars.localNode,
              this.globalVars.loggedInUser.PublicKeyBase58Check,
              this.post.PostHashHex,
              nftEntry.SerialNumber,
              false,
              nftEntry.MinBidAmountNanos,
              this.globalVars.defaultFeeRateNanosPerKB
            )
            .pipe(
              map((res) => {
                this.auctionCounter++;
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
          this.modalService.setDismissReason("auction cancelled");
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(this.backendApi.parseMessageError(err));
        }
      )
      .add(() => (this.closingAuction = false));
  }
}
