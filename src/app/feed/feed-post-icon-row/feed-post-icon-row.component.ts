import {Component, Input, ChangeDetectorRef, ViewChild, HostListener} from "@angular/core";
import { ConfettiSvg, GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { RouteNames } from "../../app-routing.module";
import { BsModalService } from "ngx-bootstrap/modal";
import { CommentModalComponent } from "../../comment-modal/comment-modal.component";
import { PopoverDirective } from "ngx-bootstrap/popover";
import { ThemeService } from "../../theme/theme.service";
import * as _ from "lodash";
import { includes, round } from "lodash";

@Component({
  selector: "feed-post-icon-row",
  templateUrl: "./feed-post-icon-row.component.html",
  styleUrls: ["./feed-post-icon-row.component.sass"],
})
export class FeedPostIconRowComponent {
  @ViewChild("diamondPopover", { static: false }) diamondPopover: PopoverDirective;

  @Input() post: PostEntryResponse;
  @Input() postContent: PostEntryResponse;
  @Input() parentPost: PostEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() afterRecloutCreatedCallback: any = null;
  @Input() hideNumbers: boolean = false;

  sendingRecloutRequest = false;

  // Threshold above which user must confirm before sending diamonds
  static DiamondWarningThreshold = 3;

  // Boolean for animation on whether a heart is clicked or not
  animateLike = false;

  diamondCount = 6;
  // Indexes from 0 to diamondCount (used by *ngFor)
  diamondIndexes = Array<number>(this.diamondCount)
    .fill(0)
    .map((x, i) => i);
  // Controls visibility of selectable diamond levels. Initialize to false.
  diamondsVisible = Array<boolean>(this.diamondCount).fill(false);
  // Store timeout functions so that they can be cancelled prematurely
  diamondTimeouts: NodeJS.Timer[] = [];
  // How quickly the diamonds sequentially appear on hover
  diamondAnimationDelay = 50;
  // Where the drag div should be placed for mobile dragging
  diamondDragLeftOffset = "0px";
  // Whether the diamond drag selector is being dragged
  diamondDragging = false;
  // If the diamond drag selector has been clicked
  diamondDragClicked = false;
  // Which diamond is selected by the drag selector
  diamondIdxDraggedTo = -1;
  // Whether the drag selector is at the top of it's bound and in position to make a transaction
  diamondDragConfirm = false;
  // Boolean for whether or not the div explaining diamonds should be collapsed or not.
  collapseDiamondInfo = true;
  // Boolean for tracking if we are processing a send diamonds event.
  sendingDiamonds = false;
  // Track the diamond selected in the diamond popover.
  diamondSelected: number;
  // Track the diamond that is currently being hovered
  diamondHovered = -1;
  // Track if we've gone past the explainer already. (Don't want to show explainer on start)
  diamondDragLeftExplainer = false;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private platformLocation: PlatformLocation,
    private ref: ChangeDetectorRef,
    private modalService: BsModalService,
    private themeService: ThemeService
  ) {}

  ngAfterViewInit() {
    this.resetDragPosition();
  }

  // Make sure that if a mobile device rotates, that the drag markers remain in the same place
  @HostListener("window:orientationchange", ["$event"])
  onOrientationChange() {
    this.resetDragPosition();
  }

  resetDragPosition() {
    setTimeout(() => {
      const likeBtn = document.getElementById("diamond-select");
      const leftOffset = this.getPosition(likeBtn).offsetLeft;
      this.diamondDragLeftOffset = `${leftOffset}px`;
    }, 200);
  }

  getPosition(element){
    let offsetLeft = 0;
    let offsetTop = 0;

    while (element) {
      offsetLeft += element.offsetLeft;
      offsetTop += element.offsetTop;
      element = element.offsetParent;
    }
    return { offsetTop: offsetTop, offsetLeft: offsetLeft };
  }

  startDrag() {
    this.diamondDragging = true;
    this.addDiamondSelection({ type: "initiateDrag" });
  }

  logDrag(event) {
    const pageMargin = window.innerWidth * 0.15;
    const selectableWidth = window.innerWidth * 0.7;
    if (event.pointerPosition.x < pageMargin) {
      this.diamondIdxDraggedTo = 0;
    } else if (event.pointerPosition.x > selectableWidth + pageMargin) {
      this.diamondIdxDraggedTo = this.diamondCount;
    } else {
      this.diamondIdxDraggedTo = round(((event.pointerPosition.x - pageMargin) / selectableWidth) * this.diamondCount);
    }
    if (this.diamondIdxDraggedTo != this.diamondCount) {
      this.diamondDragLeftExplainer = true;
    }

    if (event.distance.y === -40) {
      this.diamondDragConfirm = true;
    } else {
      this.diamondDragConfirm = false;
    }
  }

  endDrag(event) {
    if (this.diamondDragConfirm && this.diamondIdxDraggedTo > -1 && this.diamondIdxDraggedTo < this.diamondCount) {
      this.onDiamondSelected(null, this.diamondIdxDraggedTo);
    }
    this.diamondDragConfirm = false;
    this.diamondDragging = false;
    this.diamondIdxDraggedTo = -1;
    this.diamondDragLeftExplainer = false;
    event.source._dragRef.reset();
  }

  _detectChanges() {
    this.ref.detectChanges();
  }

  _preventNonLoggedInUserActions(action: string) {
    this.globalVars.logEvent(`alert : ${action} : account`);

    return SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      icon: "info",
      title: `Create an account to ${action}`,
      html: `It's totally anonymous and takes under a minute`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Create an account",
      cancelButtonText: "Nevermind",
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.globalVars.launchSignupFlow();
      }
    });
  }

  userHasReclouted(): boolean {
    return this.postContent.PostEntryReaderState && this.postContent.PostEntryReaderState.RecloutedByReader;
  }

  mobileDiamondDrag(event) {
    console.log(event);
  }

  _reclout(event: any) {
    // Prevent the post from navigating.
    event.stopPropagation();

    // If the user isn't logged in, alert them.
    if (this.globalVars.loggedInUser == null) {
      return this._preventNonLoggedInUserActions("reclout");
    } else if (this.globalVars && !this.globalVars.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : reclout : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }
    if (!this.postContent.PostEntryReaderState) {
      this.postContent.PostEntryReaderState = {};
    }

    this.sendingRecloutRequest = true;
    this._detectChanges();
    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PostEntryReaderState.RecloutPostHashHex || "" /*PostHashHexToModify*/,
        "" /*ParentPostHashHex*/,
        "" /*Title*/,
        {},
        this.postContent.PostHashHex,
        {},
        "" /*Sub*/,
        false /*IsHidden*/,
        // What should the fee rate be for this?
        this.globalVars.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : reclout");
          // Only set the RecloutPostHashHex if this is the first time a user is reclouting a post.
          if (!this.postContent.PostEntryReaderState.RecloutPostHashHex) {
            this.postContent.PostEntryReaderState.RecloutPostHashHex = response.PostHashHex;
          }
          this.postContent.RecloutCount += 1;
          this.postContent.PostEntryReaderState.RecloutedByReader = true;
          this.sendingRecloutRequest = false;
          this._detectChanges();
        },
        (err) => {
          console.error(err);
          this.sendingRecloutRequest = false;
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars.logEvent("post : reclout : error", { parsedError });
          this.globalVars._alertError(parsedError);
          this._detectChanges();
        }
      );
  }

  _undoReclout(event: any) {
    // Prevent the post from navigating.
    event.stopPropagation();

    // If the user isn't logged in, alert them.
    if (this.globalVars.loggedInUser == null) {
      return this._preventNonLoggedInUserActions("undo reclout");
    }
    this.sendingRecloutRequest = true;

    this._detectChanges();
    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PostEntryReaderState.RecloutPostHashHex || "" /*PostHashHexToModify*/,
        "" /*ParentPostHashHex*/,
        "" /*Title*/,
        {} /*BodyObj*/,
        this.postContent.PostHashHex,
        {},
        "" /*Sub*/,
        true /*IsHidden*/,
        // What should the fee rate be for this?
        this.globalVars.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : unreclout");
          this.postContent.RecloutCount--;
          this.postContent.PostEntryReaderState.RecloutedByReader = false;
          this.sendingRecloutRequest = false;
          this._detectChanges();
        },
        (err) => {
          console.error(err);
          this.sendingRecloutRequest = false;
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars.logEvent("post : unreclout : error", { parsedError });
          this.globalVars._alertError(parsedError);
          this._detectChanges();
        }
      );
  }

  toggleLike(event: any) {
    // Prevent the post from navigating.
    event.stopPropagation();

    // If the user isn't logged in, alert them.
    if (this.globalVars.loggedInUser == null) {
      return this._preventNonLoggedInUserActions("like");
    }

    // If the reader hasn't liked a post yet, they won't have a reader state.
    if (this.postContent.PostEntryReaderState == null) {
      this.postContent.PostEntryReaderState = { LikedByReader: false };
    }

    let isUnlike;
    // Immediately toggle like and increment/decrement so that it feels instant.
    if (this.postContent.PostEntryReaderState.LikedByReader) {
      this.postContent.LikeCount--;
      this.postContent.PostEntryReaderState.LikedByReader = false;
      isUnlike = true;
    } else {
      this.postContent.LikeCount++;
      this.postContent.PostEntryReaderState.LikedByReader = true;
      isUnlike = false;
    }
    this.ref.detectChanges();
    // Fire off the transaction.
    this.backendApi
      .CreateLike(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PostHashHex,
        isUnlike,
        this.globalVars.feeRateBitCloutPerKB * 1e9
      )
      .subscribe(
        (res) => {
          this.globalVars.logEvent(`post : ${isUnlike ? "unlike" : "like"}`);
        },
        (err) => {
          this.globalVars.logEvent(`post : ${isUnlike ? "unlike" : "like"} : error`);
          console.error(err);
        }
      );
  }

  openModal(event, isQuote: boolean = false) {
    // Prevent the post navigation click from occurring.
    event.stopPropagation();

    if (!this.globalVars.loggedInUser) {
      // Check if the user has an account.
      this.globalVars.logEvent("alert : reply : account");
      SharedDialogs.showCreateAccountToPostDialog(this.globalVars);
    } else if (!this.globalVars.doesLoggedInUserHaveProfile()) {
      // Check if the user has a profile.
      this.globalVars.logEvent("alert : reply : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
    } else {
      const initialState = {
        // If we are quoting a post, make sure we pass the content so we don't reclout a reclout.
        parentPost: this.postContent,
        afterCommentCreatedCallback: isQuote ? this.afterRecloutCreatedCallback : this.afterCommentCreatedCallback,
        isQuote,
      };

      // If the user has an account and a profile, open the modal so they can comment.
      this.modalService.show(CommentModalComponent, {
        class: "modal-dialog-centered",
        initialState,
      });
    }
  }

  copyPostLinkToClipboard(event) {
    this.globalVars.logEvent("post : share");

    // Prevent the post from navigating.
    event.stopPropagation();

    this.globalVars._copyText(this._getPostUrl());
  }

  onTimestampClickHandler(event) {
    this.globalVars.logEvent("post : share");

    // Prevent the post from navigating.
    event.stopPropagation();

    //condition to check whether middle mouse btn is clicked
    if (event.which == 2) {
      window.open(this._getPostUrl(), "_blank");
    }
  }

  // this is a bit of a hacky solution, not sure what the right way to do this is
  //
  // this solution is from https://stackoverflow.com/questions/41447305/how-to-get-an-absolute-url-by-a-route-name-in-angular-2
  // which got its answer from https://stackoverflow.com/questions/38485171/angular-2-access-base-href
  // but the angular docs say not to use PlatformLocation https://angular.io/api/common/PlatformLocation
  // maybe we should just use window.location.href instead...
  _getPostUrl() {
    const route = this.postContent.IsNFT ? this.globalVars.RouteNames.NFT : this.globalVars.RouteNames.POSTS;
    const pathArray = ["/" + route, this.postContent.PostHashHex];

    // need to preserve the curent query params for our dev env to work
    const currentQueryParams = this.activatedRoute.snapshot.queryParams;

    const path = this.router.createUrlTree(pathArray, { queryParams: currentQueryParams }).toString();
    const origin = (this.platformLocation as any).location.origin;

    return origin + path;
  }

  toggleExplainer(event) {
    event.stopPropagation();
    this.collapseDiamondInfo = !this.collapseDiamondInfo;
  }

  diamondDragClick(event) {
    if (!this.diamondDragClicked) {
      this.diamondDragClicked = true;
      this.addDiamondSelection({ type: "initiateDrag" });
    } else {
      this.diamondDragClicked = false;
    }
    event.stopPropagation();
  }

  sendDiamonds(diamonds: number, skipCelebration: boolean = false): Promise<void> {
    this.diamondDragClicked = false;
    this.sendingDiamonds = true;
    return this.backendApi
      .SendDiamonds(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PosterPublicKeyBase58Check,
        this.postContent.PostHashHex,
        diamonds,
        this.globalVars.feeRateBitCloutPerKB * 1e9
      )
      .toPromise()
      .then(
        (res) => {
          this.sendingDiamonds = false;
          this.globalVars.logEvent("diamond: send", {
            SenderPublicKeyBase58Check: this.globalVars.loggedInUser.PublicKeyBase58Check,
            ReceiverPublicKeyBase58Check: this.postContent.PosterPublicKeyBase58Check,
            DiamondPostHashHex: this.postContent.PostHashHex,
            DiamondLevel: diamonds,
          });
          this.diamondSelected = diamonds;
          this.postContent.DiamondCount += diamonds - this.getCurrentDiamondLevel();
          this.postContent.PostEntryReaderState.DiamondLevelBestowed = diamonds;
          if (!skipCelebration) {
            // Celebrate when the SendDiamonds call completes
            this.globalVars.celebrate([ConfettiSvg.DIAMOND]);
          }
          this.globalVars.updateEverything(res.TxnHashHex, this.sendDiamondsSuccess, this.sendDiamondsFailure, this);
        },
        (err) => {
          if (err.status === 0) {
            return this.globalVars._alertError("BitClout is under heavy load. Please try again in one minute.");
          }
          this.sendingDiamonds = false;
          const parsedError = this.backendApi.parseProfileError(err);
          this.globalVars.logEvent("diamonds: send: error", { parsedError });
          this.globalVars._alertError(parsedError);
        }
      );
  }

  sendDiamondsSuccess(comp: FeedPostIconRowComponent) {
    comp.sendingDiamonds = false;
  }

  sendDiamondsFailure(comp: FeedPostIconRowComponent) {
    comp.sendingDiamonds = false;
    comp.globalVars._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
  }

  popoverOpenClickHandler = (e: Event) => {
    const popoverElement = document.getElementById("diamond-popover");
    if (popoverElement && e.target !== popoverElement && !popoverElement.contains(e.target as any)) {
      e.stopPropagation();
    }
  };

  async sendOneDiamond(event) {
    // Disable diamond selection if diamonds are being sent
    if (this.sendingDiamonds) {
      return;
    }

    // Block user from selecting diamond level below already gifted amount
    if (this.getCurrentDiamondLevel() > 0) {
      return;
    }

    // Don't trigger diamond purchases on tap on mobile
    if (event.pointerType === "touch") {
      event.stopPropagation();
      return;
    }

    this.onDiamondSelected(event, 0);
  }

  addDiamondSelection(event) {
    // Need to make sure hover event doesn't trigger on child elements
    if (event?.type === "initiateDrag" || includes(event.path[0].classList, "like-btn")) {
      for (let idx = 0; idx < this.diamondCount; idx++) {
        this.diamondTimeouts[idx] = setTimeout(() => {
          this.diamondsVisible[idx] = true;
        }, idx * this.diamondAnimationDelay);
      }
    }
  }

  removeDiamondSelection() {
    for (let idx = 0; idx < this.diamondCount; idx++) {
      clearTimeout(this.diamondTimeouts[idx]);
      this.diamondsVisible[idx] = false;
    }
  }

  async onDiamondSelected(event: any, index: number): Promise<void> {
    // Disable diamond selection if diamonds are being sent
    if (this.sendingDiamonds) {
      return;
    }

    if (event && event.pointerType === "touch" && includes(event.path[0].classList, "reaction-icon")) {
      event.stopPropagation();
      return;
    }

    // Block user from selecting diamond level below already gifted amount
    if (index < this.getCurrentDiamondLevel()) {
      return;
    }

    if (index + 1 <= this.postContent.PostEntryReaderState.DiamondLevelBestowed) {
      this.globalVars._alertError("You cannot downgrade a diamond");
      return;
    }
    this.diamondSelected = index + 1;
    if (event) {
      event.stopPropagation();
    }
    if (this.diamondSelected > FeedPostIconRowComponent.DiamondWarningThreshold) {
      SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: "info",
        title: `Sending ${this.diamondSelected} diamonds to ${this.postContent.ProfileEntryResponse?.Username}`,
        html: `Clicking confirm will send ${this.globalVars.getUSDForDiamond(
          this.diamondSelected
        )} worth of your creator coin to @${this.postContent.ProfileEntryResponse?.Username}`,
        showCancelButton: true,
        showConfirmButton: true,
        focusConfirm: true,
        customClass: {
          confirmButton: "btn btn-light",
          cancelButton: "btn btn-light no",
        },
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      }).then(async (res: any) => {
        if (res.isConfirmed) {
          await this.sendDiamonds(this.diamondSelected);
        }
      });
    } else {
      await this.sendDiamonds(this.diamondSelected);
    }
  }

  getCurrentDiamondLevel(): number {
    return this.postContent.PostEntryReaderState?.DiamondLevelBestowed || 0;
  }

  getPopoverContainerClass() {
    const mobileClass = this.globalVars.isMobile() ? "diamond-popover-container-mobile " : "";
    return "diamond-popover-container " + mobileClass;
  }
}
