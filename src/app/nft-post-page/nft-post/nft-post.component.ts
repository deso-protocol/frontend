import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import {
  BackendApiService,
  NFTBidData,
  NFTBidEntryResponse,
  NFTEntryResponse,
  PostEntryResponse,
} from "../../backend-api.service";
import { Title } from "@angular/platform-browser";
import { BsModalService } from "ngx-bootstrap/modal";
import { PlaceBidModalComponent } from "../../place-bid-modal/place-bid-modal.component";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { RouteNames } from "../../app-routing.module";
import { Location } from "@angular/common";
import * as _ from "lodash";
import { SellNftModalComponent } from "../../sell-nft-modal/sell-nft-modal.component";
import { of } from "rxjs";
import { concatMap, last } from "rxjs/operators";
import { NftSoldModalComponent } from "../../nft-sold-modal/nft-sold-modal.component";
import { CloseNftAuctionModalComponent } from "../../close-nft-auction-modal/close-nft-auction-modal.component";

@Component({
  selector: "nft-post",
  templateUrl: "./nft-post.component.html",
  styleUrls: ["./nft-post.component.scss"],
})
export class NftPostComponent {
  nftPost: PostEntryResponse;
  nftPostHashHex: string;
  nftBidData: NFTBidData;
  availableSerialNumbers: NFTEntryResponse[];
  myAvailableSerialNumbers: NFTEntryResponse[];
  loading = true;
  sellNFTDisabled = true;
  showPlaceABid: boolean;
  highBid: number;
  lowBid: number;
  selectedBids: boolean[];
  selectedBid: NFTBidEntryResponse;

  activeTab = NftPostComponent.MY_AUCTION;

  static THREAD = "Thread";
  static ACTIVE_BIDS = "Active Bids";
  static MY_AUCTION = "My Auction";
  static OWNERS = "Owners";

  tabs = [NftPostComponent.THREAD, NftPostComponent.ACTIVE_BIDS, NftPostComponent.MY_AUCTION, NftPostComponent.OWNERS];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private changeRef: ChangeDetectorRef,
    private modalService: BsModalService,
    private titleService: Title,
    private location: Location
  ) {
    // This line forces the component to reload when only a url param changes.  Without this, the UiScroll component
    // behaves strangely and can reuse data from a previous post.
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.route.params.subscribe((params) => {
      this._setStateFromActivatedRoute(route);
    });
  }

  getPost(fetchParents: boolean = true) {
    // Hit the Get Single Post endpoint with specific parameters
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }
    return this.backendApi.GetSinglePost(
      this.globalVars.localNode,
      this.nftPostHashHex /*PostHashHex*/,
      readerPubKey /*ReaderPublicKeyBase58Check*/,
      fetchParents,
      0,
      0,
      this.globalVars.showAdminTools() /*AddGlobalFeedBool*/
    );
  }

  refreshPosts() {
    // Fetch the post entry
    this.getPost().subscribe(
      (res) => {
        if (!res || !res.PostFound) {
          this.router.navigateByUrl("/" + this.globalVars.RouteNames.NOT_FOUND, { skipLocationChange: true });
          return;
        }
        if (!res.PostFound.IsNFT) {
          SwalHelper.fire({
            target: this.globalVars.getTargetComponentSelector(),
            title: "This post is not an NFT",
            showConfirmButton: true,
            showCancelButton: true,
            customClass: {
              confirmButton: "btn btn-light",
              cancelButton: "btn btn-light no",
            },
            confirmButtonText: "View Post",
            cancelButtonText: "Go back",
            reverseButtons: true,
          }).then((res) => {
            if (res.isConfirmed) {
              this.router.navigate(["/" + RouteNames.POSTS + "/" + this.nftPost.PostHashHex]);
              return;
            }
            this.location.back();
          });
          return;
        }
        // Set current post
        this.nftPost = res.PostFound;
        this.titleService.setTitle(this.nftPost.ProfileEntryResponse.Username + " on BitClout");
        this.backendApi
          .GetNFTBidsForNFTPost(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.nftPost.PostHashHex
          )
          .subscribe(
            (res) => {
              this.nftBidData = res;
              this.availableSerialNumbers = this.nftBidData.NFTEntryResponses.filter(
                (nftEntryResponse) => nftEntryResponse.IsForSale
              );
              this.myAvailableSerialNumbers = this.availableSerialNumbers.filter(
                (nftEntryResponse) =>
                  nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser.PublicKeyBase58Check
              );
              this.showPlaceABid = !!(this.availableSerialNumbers.length - this.myAvailableSerialNumbers.length);
              this.highBid = this.getMaxBidAmountFromList(this.nftBidData.BidEntryResponses);
              this.lowBid = this.getMinBidAmountFromList(this.nftBidData.BidEntryResponses);
            },
            (err) => {
              console.error(err);
              this.globalVars._alertError(err);
            }
          )
          .add(() => (this.loading = false));
      },
      (err) => {
        // TODO: post threads: rollbar
        console.error(err);
        this.router.navigateByUrl("/" + this.globalVars.RouteNames.NOT_FOUND, { skipLocationChange: true });
        this.loading = false;
      }
    );
  }

  getMaxBidAmountFromList(bidEntryResponses: NFTBidEntryResponse[]): number {
    return _.maxBy(bidEntryResponses, (bidEntryResponse) => bidEntryResponse.BidAmountNanos)?.BidAmountNanos;
  }

  getMinBidAmountFromList(bidEntryResponses: NFTBidEntryResponse[]): number {
    return _.minBy(bidEntryResponses, (bidEntryResponses) => bidEntryResponses.BidAmountNanos)?.BidAmountNanos;
  }

  _setStateFromActivatedRoute(route) {
    if (this.nftPostHashHex !== route.snapshot.params.postHashHex) {
      // get the username of the target user (user whose followers / following we're obtaining)
      this.nftPostHashHex = route.snapshot.params.postHashHex;

      // it's important that we call this here and not in ngOnInit. Angular does not reload components when only a param changes.
      // We are responsible for refreshing the components.
      // if the user is on a thread page and clicks on a comment, the nftPostHashHex will change, but angular won't "load a new
      // page" and re-render the whole component using the new post hash. instead, angular will
      // continue using the current component and merely change the URL. so we need to explictly
      // refresh the posts every time the route changes.
      this.loading = true;
      this.refreshPosts();
    }
  }

  isPostBlocked(post: any): boolean {
    return this.globalVars.hasUserBlockedCreator(post.PosterPublicKeyBase58Check);
  }

  afterUserBlocked(blockedPubKey: any) {
    this.globalVars.loggedInUser.BlockedPubKeys[blockedPubKey] = {};
  }

  sellNFT(): void {
    if (this.sellNFTDisabled) {
      return;
    }
    this.modalService.show(SellNftModalComponent, {
      class: "modal-dialog-center",
      initialState: {
        post: this.nftPost,
        nftEntries: this.nftBidData.NFTEntryResponses,
        selectedBidEntries: this.nftBidData.BidEntryResponses.filter((bidEntry) => bidEntry.selected),
      },
    });
  }

  checkSelectedBidEntries(bidEntry: NFTBidEntryResponse): void {
    if (bidEntry.selected) {
      // De-select any bid entries for the same serial number.
      this.nftBidData.BidEntryResponses.forEach((bidEntryResponse) => {
        if (
          bidEntryResponse.SerialNumber === bidEntry.SerialNumber &&
          bidEntry !== bidEntryResponse &&
          bidEntryResponse.selected
        ) {
          bidEntryResponse.selected = false;
        }
      });
    }
    // enabled / disable the Sell NFT button based on the count of bid entries that are selected.
    this.sellNFTDisabled = !this.nftBidData.BidEntryResponses.filter((bidEntryResponse) => bidEntryResponse.selected)
      ?.length;
  }

  selectBidEntry(bidEntry: NFTBidEntryResponse): void {
    bidEntry.selected = true;
    this.sellNFTDisabled = false;
  }

  closeAuction(): void {
    this.modalService.show(CloseNftAuctionModalComponent, {
      class: "modal-dialog-centered",
      initialState: {
        post: this.nftPost,
        myAvailableSerialNumbers: this.myAvailableSerialNumbers,
      },
    });
  }

  userOwnsSerialNumber(serialNumber: number): boolean {
    const loggedInPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    return !!this.nftBidData.NFTEntryResponses.filter(
      (nftEntryResponse) =>
        nftEntryResponse.SerialNumber === serialNumber && nftEntryResponse.OwnerPublicKeyBase58Check === loggedInPubKey
    ).length;
  }
}
