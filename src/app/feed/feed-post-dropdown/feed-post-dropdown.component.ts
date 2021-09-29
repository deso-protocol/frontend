import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { NFTEntryResponse, PostEntryResponse } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { BsModalService } from "ngx-bootstrap/modal";
import { BackendApiService } from "../../backend-api.service";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

// RPH Modals
import { MintNftModalComponent } from "../../mint-nft-modal/mint-nft-modal.component";
import { CreateNftAuctionModalComponent } from "../../create-nft-auction-modal/create-nft-auction-modal.component";

@Component({
  selector: "feed-post-dropdown",
  templateUrl: "./feed-post-dropdown.component.html",
  styleUrls: ["./feed-post-dropdown.component.sass"],
})
export class FeedPostDropdownComponent {
  @Input() post: PostEntryResponse;
  @Input() postContent: PostEntryResponse;
  @Input() nftEntryResponses: NFTEntryResponse[];

  @Output() postHidden = new EventEmitter();
  @Output() userBlocked = new EventEmitter();
  @Output() toggleGlobalFeed = new EventEmitter();
  @Output() togglePostPin = new EventEmitter();

  showSharePost: boolean = false;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private platformLocation: PlatformLocation
  ) {
    if (!!navigator.share) {
      this.showSharePost = true;
    }
  }

  reportPost(): void {
    this.globalVars.logEvent("post : report-content");
    window.open(
      `https://report.bitclout.com?ReporterPublicKey=${this.globalVars.loggedInUser?.PublicKeyBase58Check}&PostHash=${this.post.PostHashHex}`
    );
  }

  dropNFT() {
    // Get the latest drop so that we can update it.
    this.backendApi
      .AdminGetNFTDrop(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, -1 /*DropNumber*/)
      .subscribe(
        (res: any) => {
          if (res.DropEntry.DropTstampNanos == 0) {
            this.globalVars._alertError("There are no drops. Make one in the admin NFT tab.");
            return;
          }

          let currentTime = new Date();
          if (res.DropEntry.DropTstampNanos / 1e6 < currentTime.getTime()) {
            SwalHelper.fire({
              target: this.globalVars.getTargetComponentSelector(),
              html:
                `The latest drop has already dropped.  Add this NFT to the active drop? ` +
                `If you would like to make a new drop, make one in the NFT admin tab first.`,
              showCancelButton: true,
              showConfirmButton: true,
              focusConfirm: true,
              customClass: {
                confirmButton: "btn btn-light",
                cancelButton: "btn btn-light no",
              },
              confirmButtonText: "Yes",
              cancelButtonText: "No",
              reverseButtons: true,
            }).then(async (alertRes: any) => {
              if (alertRes.isConfirmed) {
                this.addNFTToLatestDrop(res.DropEntry, this.post.PostHashHex);
              }
            });
            return;
          }

          this.addNFTToLatestDrop(res.DropEntry, this.post.PostHashHex);
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }

  addNFTToLatestDrop(latestDrop: any, postHash: string) {
    this.backendApi
      .AdminUpdateNFTDrop(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        latestDrop.DropNumber,
        latestDrop.DropTstampNanos,
        latestDrop.IsActive /*IsActive*/,
        postHash /*NFTHashHexToAdd*/,
        "" /*NFTHashHexToRemove*/
      )
      .subscribe(
        (res: any) => {
          this.globalVars._alertSuccess("Successfully added NFT to drop #" + latestDrop.DropNumber.toString());
        },
        (error) => {
          this.globalVars._alertError(error.error.error);
        }
      );
  }

  showBlockUserDropdownItem() {
    if (!this.globalVars.loggedInUser) {
      return false;
    }

    // User shouldn't be able to block themselves
    return (
      this.globalVars.loggedInUser?.PublicKeyBase58Check !== this.post.PosterPublicKeyBase58Check &&
      !this.globalVars.hasUserBlockedCreator(this.post.PosterPublicKeyBase58Check)
    );
  }

  showHidePostDropdownItem() {
    if (!this.globalVars.loggedInUser) {
      return false;
    }

    const loggedInUserPostedThis =
      this.globalVars.loggedInUser.PublicKeyBase58Check === this.post.PosterPublicKeyBase58Check;
    const loggedInUserIsGloboMod =
      this.globalVars.globoMods && this.globalVars.globoMods[this.globalVars.loggedInUser.PublicKeyBase58Check];

    return loggedInUserPostedThis || loggedInUserIsGloboMod;
  }

  globalFeedEligible(): boolean {
    return this.globalVars.showAdminTools();
  }

  showAddToGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && !this.post.InGlobalFeed;
  }

  showRemoveFromGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && this.post.InGlobalFeed;
  }

  showPinPostToGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && !this.post.IsPinned;
  }

  showUnpinPostFromGlobalFeedDropdownItem(): boolean {
    return this.globalFeedEligible() && this.post.IsPinned;
  }

  showCreateNFTAuction(): boolean {
    return (
      this.post.IsNFT &&
      !!this.nftEntryResponses?.filter(
        (nftEntryResponse) =>
          !nftEntryResponse.IsForSale &&
          nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check
      )?.length
    );
  }

  hidePost() {
    this.postHidden.emit();
  }

  blockUser() {
    this.userBlocked.emit();
  }

  _addPostToGlobalFeed(event: any) {
    this.toggleGlobalFeed.emit(event);
  }

  _pinPostToGlobalFeed(event: any) {
    this.togglePostPin.emit(event);
  }

  copyPostLinkToClipboard(event) {
    this.globalVars.logEvent("post : share");

    // Prevent the post from navigating.
    event.stopPropagation();

    this.globalVars._copyText(this._getPostUrl());
  }

  sharePostUrl(event): void {
    this.globalVars.logEvent("post : webapishare");

    // Prevent the post from navigating.
    event.stopPropagation();

    try {
      navigator.share({ url: this._getPostUrl() });
    } catch (err) {
      console.error("Share failed:", err.message);
    }
  }

  _getPostUrl() {
    const pathArray = ["/" + this.globalVars.RouteNames.POSTS, this.postContent.PostHashHex];

    // need to preserve the curent query params for our dev env to work
    const currentQueryParams = this.activatedRoute.snapshot.queryParams;

    const path = this.router.createUrlTree(pathArray, { queryParams: currentQueryParams }).toString();
    const origin = (this.platformLocation as any).location.origin;

    return origin + path;
  }

  openMintNftModal(event, component): void {
    event.stopPropagation();
    this.modalService.show(MintNftModalComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: { post: this.post },
    });
  }

  openCreateNFTAuctionModal(event): void {
    this.modalService.show(CreateNftAuctionModalComponent, {
      class: "modal-dialog-centered",
      initialState: { post: this.post, nftEntryResponses: this.nftEntryResponses },
    });
  }
}
