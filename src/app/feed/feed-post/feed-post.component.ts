import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, AfterViewInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, NFTEntryResponse, PostEntryResponse } from "../../backend-api.service";
import { AppRoutingModule } from "../../app-routing.module";
import { Router } from "@angular/router";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { FeedPostImageModalComponent } from "../feed-post-image-modal/feed-post-image-modal.component";
import { DiamondsModalComponent } from "../../diamonds-modal/diamonds-modal.component";
import { LikesModalComponent } from "../../likes-modal/likes-modal.component";
import { RecloutsModalComponent } from "../../reclouts-modal/reclouts-modal.component";
import { QuoteRecloutsModalComponent } from "../../quote-reclouts-modal/quote-reclouts-modal.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { DomSanitizer } from "@angular/platform-browser";
import * as _ from "lodash";
import { PlaceBidModalComponent } from "../../place-bid-modal/place-bid-modal.component";
import { EmbedUrlParserService } from "../../../lib/services/embed-url-parser-service/embed-url-parser-service";
import { SharedDialogs } from "../../../lib/shared-dialogs";

@Component({
  selector: "feed-post",
  templateUrl: "./feed-post.component.html",
  styleUrls: ["./feed-post.component.sass"],
})
export class FeedPostComponent implements OnInit {
  @Input()
  get post(): PostEntryResponse {
    return this._post;
  }
  set post(post: PostEntryResponse) {
    // When setting the post, we need to consider reclout behavior.
    // If a post is a reclouting another post (without a quote), then use the reclouted post as the post content.
    // If a post is quoting another post, then we use the quoted post as the quoted content.
    this._post = post;
    if (this.isReclout(post)) {
      this.postContent = post.RecloutedPostEntryResponse;
      this.reclouterProfile = post.ProfileEntryResponse;
      if (this.isQuotedClout(post.RecloutedPostEntryResponse)) {
        this.quotedContent = this.postContent.RecloutedPostEntryResponse;
      }
    } else if (this.isQuotedClout(post)) {
      this.postContent = post;
      this.quotedContent = post.RecloutedPostEntryResponse;
    } else {
      this.postContent = post;
    }
  }

  @Input() set blocked(value: boolean) {
    this._blocked = value;
    this.ref.detectChanges();
  }
  get blocked() {
    return this._blocked;
  }

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private ref: ChangeDetectorRef,
    private router: Router,
    private modalService: BsModalService,
    private sanitizer: DomSanitizer
  ) {}

  // Got this from https://code.habd.as/jhabdas/xanthippe/src/branch/master/lib/xanthippe.js#L8
  // Other regexes:
  //   - https://stackoverflow.com/questions/7150652/regex-valid-twitter-mention/8975426
  //   - https://github.com/regexhq/mentions-regex
  static MENTIONS_REGEX = /\B\@([\w\-]+)/gim;

  @Input() showIconRow = true;
  @Input() showAdminRow = false;
  @Input() contentShouldLinkToThread: boolean;

  @Input() afterCommentCreatedCallback: any = null;
  @Input() afterRecloutCreatedCallback: any = null;
  @Input() showReplyingToContent: any = null;
  @Input() parentPost;
  @Input() isParentPostInThread = false;
  @Input() showThreadConnectionLine = false;
  @Input() showLeftSelectedBorder = false;
  @Input() showInteractionDetails = false;
  @Input() isQuotedContent: boolean = false;

  @Input() showDropdown = true;
  @Input() hideFollowLink = false;

  @Input() includePaddingOnPost = false;

  @Input() showQuotedContent = true;
  @Input() hoverable = true;
  @Input() cardStyle: boolean = false;

  @Input() showReplyingTo = false;
  @Input() nftCollectionHighBid = 0;
  @Input() nftCollectionLowBid = 0;
  @Input() isForSaleOnly: boolean = false;

  @Input() showNFTDetails = false;
  @Input() showExpandedNFTDetails = false;
  @Input() setBorder = false;
  @Input() showAvailableSerialNumbers = false;

  @Input() profilePublicKeyBase58Check: string = "";

  // If the post is shown in a modal, this is used to hide the modal on post click.
  @Input() containerModalRef: any = null;

  // emits the PostEntryResponse
  @Output() postDeleted = new EventEmitter();

  // emits the UserBlocked event
  @Output() userBlocked = new EventEmitter();

  AppRoutingModule = AppRoutingModule;
  stakeAmount = 1;
  loggedInUserStakeAmount = 0;
  loggedInUserNextStakePayout = -1;
  addingPostToGlobalFeed = false;
  reclout: any;
  postContent: any;
  reclouterProfile: any;
  _post: any;
  pinningPost = false;
  hidingPost = false;
  quotedContent: any;
  _blocked: boolean;
  constructedEmbedURL: any;

  showPlaceABid: boolean;
  highBid: number;
  lowBid: number;
  availableSerialNumbers: NFTEntryResponse[];
  myAvailableSerialNumbers: NFTEntryResponse[];
  mySerialNumbersNotForSale: NFTEntryResponse[];
  serialNumbersDisplay: string;
  nftEntryResponses: NFTEntryResponse[];
  decryptableNFTEntryResponses: NFTEntryResponse[];

  unlockableTooltip =
    "This NFT will come with content that encrypted and only unlockable by the winning bidder. Note that if an NFT is being resold, it is not guaranteed that the new unlockable will be the same original unlockable.";

  ngOnInit() {
    if (this.globalVars.loggedInUser) {
      this.loggedInUserStakeAmount = this._getLoggedInUserStakeAmount();
      this.loggedInUserNextStakePayout = this._getLoggedInUserNextStakePayout();
    }
    if (!this.post.RecloutCount) {
      this.post.RecloutCount = 0;
    }
    this.setEmbedURLForPostContent();
    if (this.postContent.IsNFT && !this.nftEntryResponses?.length) {
      this.backendApi
        .GetNFTEntriesForNFTPost(
          this.globalVars.localNode,
          this.globalVars.loggedInUser?.PublicKeyBase58Check,
          this.postContent.PostHashHex
        )
        .subscribe((res) => {
          this.nftEntryResponses = res.NFTEntryResponses;
          this.nftEntryResponses.sort((a, b) => a.SerialNumber - b.SerialNumber);
          this.decryptableNFTEntryResponses = this.nftEntryResponses.filter(
            (sn) =>
              sn.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check &&
              sn.EncryptedUnlockableText &&
              sn.LastOwnerPublicKeyBase58Check
          );
          if (this.decryptableNFTEntryResponses.length) {
            this.backendApi
              .DecryptUnlockableTexts(
                this.globalVars.loggedInUser?.PublicKeyBase58Check,
                this.decryptableNFTEntryResponses
              )
              .subscribe((res) => (this.decryptableNFTEntryResponses = res));
          }
          this.availableSerialNumbers = this.nftEntryResponses.filter((nftEntryResponse) => nftEntryResponse.IsForSale);
          const profileSerialNumbers = this.nftEntryResponses.filter(
            (serialNumber) =>
              serialNumber.OwnerPublicKeyBase58Check === this.profilePublicKeyBase58Check &&
              (!this.isForSaleOnly || serialNumber.IsForSale)
          );
          this.serialNumbersDisplay =
            profileSerialNumbers
              .map((serialNumber) => `#${serialNumber.SerialNumber}`)
              .slice(0, 5)
              .join(", ") + (profileSerialNumbers.length > 5 ? "..." : "");
          this.mySerialNumbersNotForSale = this.nftEntryResponses.filter(
            (nftEntryResponse) =>
              !nftEntryResponse.IsForSale &&
              nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser.PublicKeyBase58Check
          );
          this.myAvailableSerialNumbers = this.availableSerialNumbers.filter(
            (nftEntryResponse) =>
              nftEntryResponse.OwnerPublicKeyBase58Check === this.globalVars.loggedInUser.PublicKeyBase58Check
          );
          this.showPlaceABid = !!(this.availableSerialNumbers.length - this.myAvailableSerialNumbers.length);
          this.highBid = _.maxBy(this.nftEntryResponses, "HighestBidAmountNanos").HighestBidAmountNanos;
          this.lowBid = _.minBy(this.nftEntryResponses, "LowestBidAmountNanos").LowestBidAmountNanos;
        });
    }

    this.highBid = this.nftCollectionHighBid;
    this.lowBid = this.nftCollectionHighBid;
  }

  onPostClicked(event) {
    if (this.containerModalRef !== null) {
      this.containerModalRef.hide();
    }

    // if we shouldn't be navigating the user to a new page, just return
    if (!this.contentShouldLinkToThread) {
      return true;
    }

    // don't navigate if the user is selecting text
    // from https://stackoverflow.com/questions/31982407/prevent-onclick-event-when-selecting-text
    const selection = window.getSelection();
    if (selection.toString().length !== 0) {
      return true;
    }

    // don't navigate if the user clicked a link
    if (event.target.tagName.toLowerCase() === "a") {
      return true;
    }

    const route = this.postContent.IsNFT ? this.globalVars.RouteNames.NFT : this.globalVars.RouteNames.POSTS;

    // identify ctrl+click (or) cmd+clik and opens feed in new tab
    if (event.ctrlKey) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(["/" + route, this.postContent.PostHashHex], {
          queryParamsHandling: "merge",
        })
      );
      window.open(url, "_blank");
      // don't navigate after new tab is opened
      return true;
    }

    this.router.navigate(["/" + route, this.postContent.PostHashHex], {
      queryParamsHandling: "merge",
    });
  }

  isReclout(post: any): boolean {
    return post.Body === "" && (!post.ImageURLs || post.ImageURLs?.length === 0) && post.RecloutedPostEntryResponse;
  }

  isQuotedClout(post: any): boolean {
    return (post.Body !== "" || post.ImageURLs?.length > 0) && post.RecloutedPostEntryResponse;
  }

  isRegularPost(post: any): boolean {
    return !this.isReclout(post) && !this.isQuotedClout(post);
  }

  openImgModal(event, imageURL) {
    event.stopPropagation();
    this.modalService.show(FeedPostImageModalComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: {
        imageURL,
      },
    });
  }

  openInteractionModal(event, component): void {
    event.stopPropagation();
    this.modalService.show(component, {
      class: "modal-dialog-centered",
      initialState: { postHashHex: this.post.PostHashHex },
    });
  }

  openDiamondsModal(event): void {
    if (this.postContent.DiamondCount) {
      this.openInteractionModal(event, DiamondsModalComponent);
    }
  }

  openLikesModal(event): void {
    if (this.postContent.LikeCount) {
      this.openInteractionModal(event, LikesModalComponent);
    }
  }

  openRecloutsModal(event): void {
    if (this.postContent.RecloutCount) {
      this.openInteractionModal(event, RecloutsModalComponent);
    }
  }

  openQuoteRecloutsModal(event): void {
    if (this.postContent.QuoteRecloutCount) {
      this.openInteractionModal(event, QuoteRecloutsModalComponent);
    }
  }

  hidePost() {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Hide post?",
      html: `This can’t be undone. The post will be removed from your profile, from search results, and from the feeds of anyone who follows you.`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((response: any) => {
      if (response.isConfirmed) {
        // Hide the post in the UI immediately, even before the delete goes thru, to give
        // the user some indication that his delete is happening. This is a little janky.
        // For example, on the feed, the border around the post is applied by an outer element,
        // so the border will remain (and the UI will look a bit off) until the delete goes thru,
        // we emit the delete event, and the parent removes the outer element/border from the UI.
        //
        // Note: This is a rare instance where I needed to call detectChanges(). Angular wasn't
        // picking up the changes until I called this explicitly. IDK why.
        this.hidingPost = true;
        this.ref.detectChanges();
        this.backendApi
          .SubmitPost(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this._post.PostHashHex /*PostHashHexToModify*/,
            "" /*ParentPostHashHex*/,
            "" /*Title*/,
            { Body: this._post.Body, ImageURLs: this._post.ImageURLs } /*BodyObj*/,
            this._post.RecloutedPostEntryResponse?.PostHashHex || "",
            {},
            "" /*Sub*/,
            true /*IsHidden*/,
            this.globalVars.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/
          )
          .subscribe(
            (response) => {
              this.globalVars.logEvent("post : hide");
              this.postDeleted.emit(response.PostEntryResponse);
            },
            (err) => {
              console.error(err);
              const parsedError = this.backendApi.parsePostError(err);
              this.globalVars.logEvent("post : hide : error", { parsedError });
              this.globalVars._alertError(parsedError);
            }
          );
      }
    });
  }

  blockUser() {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Block user?",
      html: `This will hide all comments from this user on your posts as well as hide them from your view on your feed and other threads.`,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((response: any) => {
      if (response.isConfirmed) {
        this.backendApi
          .BlockPublicKey(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.post.PosterPublicKeyBase58Check
          )
          .subscribe(
            () => {
              this.globalVars.logEvent("user : block");
              this.globalVars.loggedInUser.BlockedPubKeys[this.post.PosterPublicKeyBase58Check] = {};
              this.userBlocked.emit(this.post.PosterPublicKeyBase58Check);
            },
            (err) => {
              console.error(err);
              const parsedError = this.backendApi.stringifyError(err);
              this.globalVars.logEvent("user : block : error", { parsedError });
              this.globalVars._alertError(parsedError);
            }
          );
      }
    });
  }

  _numToFourChars(numToConvert: number) {
    let abbrev = numToConvert.toFixed(2);
    const hasDecimal = abbrev.split(".").length == 2;
    if (hasDecimal) {
      // If it has a decimal and is <1000, there are three cases to consider.
      if (abbrev.length <= 4) {
        return abbrev;
      }
      if (abbrev.length == 5) {
        return numToConvert.toFixed(1);
      }
      if (abbrev.length == 6) {
        return numToConvert.toFixed();
      }
    }

    // If we get here, the number should not show a decimal in the UI.
    abbrev = numToConvert.toFixed();
    if (abbrev.length <= 3) {
      return abbrev;
    }

    abbrev = (numToConvert / 1e3).toFixed() + "K";
    if (abbrev.length <= 4) {
      return abbrev;
    }

    abbrev = (numToConvert / 1e6).toFixed() + "M";
    if (abbrev.length <= 4) {
      return abbrev;
    }

    abbrev = (numToConvert / 1e9).toFixed() + "B";
    if (abbrev.length <= 4) {
      return abbrev;
    }
  }

  _getLoggedInUserStakeAmount() {
    if (this.post.StakeEntry.StakeList.length === 0) {
      return 0;
    }
    let totalStake = 0;
    for (let ii = 0; ii < this.post.StakeEntry.StakeList.length; ii++) {
      if (
        this.post.StakeEntry.StakeList[ii].StakerPublicKeyBase58Check ==
        this.globalVars.loggedInUser.PublicKeyBase58Check
      ) {
        totalStake += this.post.StakeEntry.StakeList[ii].InitialStakeNanos;
      }
    }
    return totalStake / 1e9;
  }

  // Returns -1 if the user is not expecting another payout.
  _getLoggedInUserNextStakePayout() {
    if (this.post.StakeEntry.StakeList.length == 0) {
      return -1;
    }
    // Start with the current amount staked.
    let payoutStakeAmount = this.post.StakeEntryStats.TotalStakeNanos;

    const loggedInUserPK = this.globalVars.loggedInUser.PublicKeyBase58Check;
    for (let ii = 0; ii < this.post.StakeEntry.StakeList.length; ii++) {
      const stakerPK = this.post.StakeEntry.StakeList[ii].StakerPublicKeyBase58Check;

      // If we find a stake that isn't the current user, add the remaining stake owed.
      if (stakerPK != loggedInUserPK && this.post.StakeEntry.StakeList[ii].RemainingStakeOwedNanos > 0) {
        payoutStakeAmount += this.post.StakeEntry.StakeList[ii].RemainingStakeOwedNanos;
      }

      // If we find a stake that *is* the current user and is unpaid, we are at the payoutStakeAmount and can return.
      else if (stakerPK == loggedInUserPK && this.post.StakeEntry.StakeList[ii].RemainingStakeOwedNanos > 0) {
        return payoutStakeAmount / 1e9;
      }
    }

    return -1;
  }

  _addPostToGlobalFeed(event: any) {
    // Prevent the post from navigating.
    event.stopPropagation();

    this.addingPostToGlobalFeed = true;
    const postHashHex = this.post.PostHashHex;
    const inGlobalFeed = this.post.InGlobalFeed;
    this.backendApi
      .AdminUpdateGlobalFeed(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        postHashHex,
        inGlobalFeed /*RemoveFromGlobalFeed*/
      )
      .subscribe(
        (res) => {
          this.post.InGlobalFeed = !this.post.InGlobalFeed;
          this.globalVars.logEvent("admin: add-post-to-global-feed", {
            postHashHex,
            userPublicKeyBase58Check: this.globalVars.loggedInUser?.PublicKeyBase58Check,
            username: this.globalVars.loggedInUser?.ProfileEntryResponse?.Username,
          });
          this.ref.detectChanges();
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.addingPostToGlobalFeed = false;
        this.ref.detectChanges();
      });
  }

  _pinPostToGlobalFeed(event: any) {
    // Prevent the post from navigating.
    event.stopPropagation();

    this.pinningPost = true;
    const postHashHex = this._post.PostHashHex;
    const isPostPinned = this._post.IsPinned;
    this.backendApi
      .AdminPinPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        postHashHex,
        isPostPinned
      )
      .subscribe(
        (res) => {
          this._post.IsPinned = isPostPinned;
          this.globalVars.logEvent("admin: pin-post-to-global-feed", {
            postHashHex,
            userPublicKeyBase58Check: this.globalVars.loggedInUser?.PublicKeyBase58Check,
            username: this.globalVars.loggedInUser?.ProfileEntryResponse?.Username,
          });
          this.ref.detectChanges();
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.pinningPost = false;
        this.ref.detectChanges();
      });
  }

  setEmbedURLForPostContent(): void {
    EmbedUrlParserService.getEmbedURL(
      this.backendApi,
      this.globalVars,
      this.postContent.PostExtraData["EmbedVideoURL"]
    ).subscribe((res) => (this.constructedEmbedURL = res));
  }

  getEmbedHeight(): number {
    return EmbedUrlParserService.getEmbedHeight(this.postContent.PostExtraData["EmbedVideoURL"]);
  }

  getEmbedWidth(): string {
    return EmbedUrlParserService.getEmbedWidth(this.postContent.PostExtraData["EmbedVideoURL"]);
  }

  // Vimeo iframes have a lot of spacing on top and bottom on mobile.
  setNegativeMargins(link: string, globalVars: GlobalVarsService) {
    return globalVars.isMobile() && EmbedUrlParserService.isVimeoLink(link);
  }

  mapImageURLs(imgURL: string): string {
    if (imgURL.startsWith("https://i.imgur.com")) {
      return imgURL.replace("https://i.imgur.com", "https://images.bitclout.com/i.imgur.com");
    }
    return imgURL;
  }

  openPlaceBidModal(event: any) {
    if (!this.globalVars.loggedInUser?.ProfileEntryResponse) {
      SharedDialogs.showCreateProfileToPerformActionDialog(this.router, "place a bid");
      return;
    }
    event.stopPropagation();
    this.modalService.show(PlaceBidModalComponent, {
      class: "modal-dialog-centered modal-lg",
      initialState: { post: this._post },
    });
  }

  showUnlockableContent = false;
  toggleShowUnlockableContent(): void {
    if (!this.decryptableNFTEntryResponses?.length) {
      return;
    }
    this.showUnlockableContent = !this.showUnlockableContent;
  }
}
