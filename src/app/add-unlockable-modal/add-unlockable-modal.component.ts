import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { CdkTextareaAutosize } from "@angular/cdk/text-field";
import { BackendApiService, NFTBidEntryResponse, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import { of } from "rxjs";
import { concatMap, filter, last, map, take } from "rxjs/operators";
import { NftSoldModalComponent } from "../nft-sold-modal/nft-sold-modal.component";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "add-unlockable-modal",
  templateUrl: "./add-unlockable-modal.component.html",
})
export class AddUnlockableModalComponent implements OnInit {
  @ViewChild("autosize") autosize: CdkTextareaAutosize;
  @Input() post: PostEntryResponse;
  @Input() nftEntries: NFTEntryResponse[];
  @Input() selectedBidEntries: NFTBidEntryResponse[];

  addDisabled = false;
  sellingNFT = false;
  unlockableText: string = "";

  constructor(
    private modalService: BsModalService,
    public bsModalRef: BsModalRef,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  ngOnInit(): void {}

  sellNFTTotal: number;
  sellNFTCounter: number = 0;
  sellNFT(): void {
    this.addDisabled = true;
    this.sellingNFT = true;
    this.sellNFTTotal = this.selectedBidEntries.length;
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
              this.unlockableText,
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
        this.addDisabled = false;
        this.sellingNFT = false;
      });
  }
}
