import { Component, OnInit, Input } from "@angular/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, NFTBidEntryResponse, NFTEntryResponse, PostEntryResponse } from "../backend-api.service";
import * as _ from "lodash";
import { of } from "rxjs";
import { concatMap, last, map } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { Location } from "@angular/common";
import {AddUnlockableModalComponent} from "../add-unlockable-modal/add-unlockable-modal.component";

@Component({
  selector: "sell-nft-modal",
  templateUrl: "./sell-nft.component.html",
})
export class SellNftComponent implements OnInit {
  @Input() postHashHex: string;
  post: PostEntryResponse;
  nftEntries: NFTEntryResponse[];
  selectedBidEntries: NFTBidEntryResponse[];
  bidEntryUsernames: string[];
  loading = false;
  sellNFTDisabled = false;
  sellingPrice = 2.0887;
  earnings = 1.3587;
  creatorRoyalty = 0.42;
  coinRoyalty = 0.21;
  serviceFee = 0.1;
  sellingNFT = false;

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    private backendApi: BackendApiService,
    private router: Router,
    private toastr: ToastrService,
    public location: Location,
    public activatedRoute: ActivatedRoute
  ) {}

  // TODO: compute service fee.
  ngOnInit(): void {
    const state = window.history.state;
    // If the state is lost, redirect back to the NFT found in the url params.
    if (!state?.post) {
      this.router.navigate(["/" + this.globalVars.RouteNames.NFT + "/" + this.activatedRoute.snapshot.params["postHashHex"]]);
      return;
    }
    this.post = state.post;
    this.nftEntries = state.nftEntries;
    this.selectedBidEntries = state.selectedBidEntries;
    this.sellToNamesString();
    this.sellingPrice = _.sumBy(this.selectedBidEntries, "BidAmountNanos") / 1e9;
    const coinRoyaltyBasisPoints = this.post.NFTRoyaltyToCoinBasisPoints;
    const creatorRoyaltyBasisPoints = this.post.NFTRoyaltyToCreatorBasisPoints;

    this.creatorRoyalty = this.sellingPrice * (creatorRoyaltyBasisPoints / (100 * 100));
    this.coinRoyalty = this.sellingPrice * (coinRoyaltyBasisPoints / (100 * 100));
    this.earnings = this.sellingPrice - this.coinRoyalty - this.creatorRoyalty;
    this.addEarningsToSelectedBidEntries();
  }

  sellNFTTotal: number;
  sellNFTCounter: number = 0;

  sellToNamesString(): void {
    this.bidEntryUsernames = _.uniq(
      _.map(_.orderBy(this.selectedBidEntries, ["BidAmountNanos"], ["desc"]), "ProfileEntryResponse.Username")
    );
  }

  // Calculate earnings for each bid entry, add to selected bid entry object
  addEarningsToSelectedBidEntries(): void {
    this.selectedBidEntries = _.map(this.selectedBidEntries, (selectedBidEntry: NFTBidEntryResponse) => {
      const sellingPrice = selectedBidEntry.BidAmountNanos;
      const creatorRoyalty = sellingPrice * (this.post.NFTRoyaltyToCreatorBasisPoints / (100 * 100));
      const coinRoyalty = sellingPrice * (this.post.NFTRoyaltyToCoinBasisPoints / (100 * 100));
      const earnings = sellingPrice - creatorRoyalty - coinRoyalty;
      return { ...selectedBidEntry, ...{ EarningsAmountNanos: earnings } };
    });
  }

  sellNFT(): void {
    if (this.post.HasUnlockable) {
      const unlockableModalDetails = this.modalService.show(AddUnlockableModalComponent, {
        class: "modal-dialog-centered",
        initialState: {
          post: this.post,
          selectedBidEntries: this.selectedBidEntries,
        },
      });
      const onHiddenEvent = unlockableModalDetails.onHidden;
      onHiddenEvent.subscribe((response) => {
        if (response === "nft sold") {
          this.modalService.setDismissReason("nft sold");
          this.location.back();
        }
      });
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
          this.toastr.show("Your nft was sold", null, {
            toastClass: "info-toast",
            positionClass: "toast-bottom-center",
          });
          this.modalService.setDismissReason("nft sold");
          this.location.back();
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
    this.router.navigate(["/" + this.globalVars.RouteNames.USER_PREFIX, bidEntry.ProfileEntryResponse.Username], {
      queryParamsHandling: "merge",
    });
  }
}
