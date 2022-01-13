import { Component, Input, ChangeDetectorRef, ViewChild, Output, EventEmitter } from "@angular/core";
import { ConfettiSvg, GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { BsModalService } from "ngx-bootstrap/modal";
import { CommentModalComponent } from "../../comment-modal/comment-modal.component";
import { PopoverDirective } from "ngx-bootstrap/popover";
import { ThemeService } from "../../theme/theme.service";
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
  @Input() afterRepostCreatedCallback: any = null;
  @Input() hideNumbers: boolean = false;
  // Will need additional inputs if we walk through actions other than diamonds.
  @Input() inTutorial: boolean = false;

  @Output() diamondSent = new EventEmitter();

  sendingRepostRequest = false;

  // Threshold above which user must confirm before sending diamonds
  static DiamondWarningThreshold = 4;

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
  // Which diamond is selected by the drag selector
  diamondIdxDraggedTo = -1;
  // Whether the drag selector is at the bottom of it's bound and in position to cancel a transaction
  diamondDragCancel = false;
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
  // Track if the dragged diamond actually moved, so that we can distinguish between drags and clicks
  diamondDragMoved = false;
  // Track when the drag began, if less than .1 seconds ago, and the drag didn't move, assume it was a click
  diamondDragStarted: Date;

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

  // Initiate mobile drag, have diamonds appear
  startDrag() {
    this.globalVars.userIsDragging = true;
    this.diamondDragMoved = false;
    this.diamondDragStarted = new Date();
    this.diamondDragging = true;
    this.addDiamondSelection({ type: "initiateDrag" });
  }

  // Calculate where the drag box has been dragged to, make updates accordingly
  duringDrag(event) {
    // If this event was triggered, the user moved the drag box, and we assume it's not a click.
    this.diamondDragMoved = true;
    // Establish a margin to the left and right in order to improve reachability
    const pageMargin = window.innerWidth * 0.15;
    // The width of the page minus the margins
    const selectableWidth = window.innerWidth - 2 * pageMargin;
    // If the selector is in the left margin, choose the first option
    if (event.pointerPosition.x < pageMargin) {
      this.diamondIdxDraggedTo = 0;
      // If the selector is in the right margin, choose the last option
    } else if (event.pointerPosition.x > selectableWidth + pageMargin) {
      this.diamondIdxDraggedTo = this.diamondCount;
    } else {
      // If the selector is in the middle, calculate what % of the middle it has been dragged to, assign a diamond value
      this.diamondIdxDraggedTo = round(((event.pointerPosition.x - pageMargin) / selectableWidth) * this.diamondCount);
    }
    // If the selector has been dragged out of the right margin, enable the helper text
    // (we don't want every drag event to start with the helper text enabled)
    if (this.diamondIdxDraggedTo != this.diamondCount) {
      this.diamondDragLeftExplainer = true;
    }
    // If the drag box is at the alloted lower boundry or below, set confirm status to true
    this.diamondDragCancel = event.distance.y > 30;
  }

  // Triggered on end of a touch. If we determine this was a "click" event, send 1 diamond. Otherwise nothing
  dragClick(event) {
    const now = new Date();
    // If the drag box wasn't moved and less than 200ms have transpired since the start of the tap,
    // assume this was a click and send 1 diamond
    if (!this.diamondDragMoved) {
      if (now.getTime() - this.diamondDragStarted.getTime() < 200) {
        // Prevent touch event from propagating
        event.preventDefault();
        this.sendOneDiamond(event, true);
      }
      // If the diamond drag box wasn't moved, we need to reset these variables.
      // If it was moved, the endDrag fn will do it.
      this.resetDragVariables();
    }
  }

  // End dragging procedure. Triggered when the dragged element is released
  endDrag(event) {
    // Stop the drag event so that the slider isn't visible during transaction load
    this.diamondDragging = false;
    // If the drag box is not in the "cancel" position, and the selected diamond makes sense, send diamonds
    if (!this.diamondDragCancel && this.diamondIdxDraggedTo > -1 && this.diamondIdxDraggedTo < this.diamondCount) {
      this.onDiamondSelected(null, this.diamondIdxDraggedTo);
    }
    // Reset drag-related variables
    this.resetDragVariables();
    // Move the drag box back to it's original position
    event.source._dragRef.reset();
  }

  resetDragVariables() {
    this.globalVars.userIsDragging = false;
    this.diamondDragCancel = false;
    this.diamondDragging = false;
    this.diamondIdxDraggedTo = -1;
    this.diamondDragMoved = false;
    this.diamondDragLeftExplainer = false;
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

  userHasReposted(): boolean {
    return this.postContent.PostEntryReaderState && this.postContent.PostEntryReaderState.RepostedByReader;
  }

  _repost(event: any) {
    if (this.inTutorial) {
      return;
    }
    // Prevent the post from navigating.
    event.stopPropagation();

    // If the user isn't logged in, alert them.
    if (this.globalVars.loggedInUser == null) {
      return this._preventNonLoggedInUserActions("repost");
    } else if (this.globalVars && !this.globalVars.doesLoggedInUserHaveProfile()) {
      this.globalVars.logEvent("alert : repost : profile");
      SharedDialogs.showCreateProfileToPostDialog(this.router);
      return;
    }
    if (!this.postContent.PostEntryReaderState) {
      this.postContent.PostEntryReaderState = {};
    }

    this.sendingRepostRequest = true;
    this._detectChanges();
    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PostEntryReaderState.RepostPostHashHex || "" /*PostHashHexToModify*/,
        "" /*ParentPostHashHex*/,
        "" /*Title*/,
        {},
        this.postContent.PostHashHex,
        {},
        "" /*Sub*/,
        false /*IsHidden*/,
        // What should the fee rate be for this?
        this.globalVars.feeRateDeSoPerKB * 1e9 /*feeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : repost");
          // Only set the RepostPostHashHex if this is the first time a user is reposting a post.
          if (!this.postContent.PostEntryReaderState.RepostPostHashHex) {
            this.postContent.PostEntryReaderState.RepostPostHashHex = response.PostHashHex;
          }
          this.postContent.RepostCount += 1;
          this.postContent.PostEntryReaderState.RepostedByReader = true;
          this.sendingRepostRequest = false;
          this._detectChanges();
        },
        (err) => {
          console.error(err);
          this.sendingRepostRequest = false;
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars.logEvent("post : repost : error", { parsedError });
          this.globalVars._alertError(parsedError);
          this._detectChanges();
        }
      );
  }

  _undoRepost(event: any) {
    if (this.inTutorial) {
      return;
    }
    // Prevent the post from navigating.
    event.stopPropagation();

    // If the user isn't logged in, alert them.
    if (this.globalVars.loggedInUser == null) {
      return this._preventNonLoggedInUserActions("undo repost");
    }
    this.sendingRepostRequest = true;

    this._detectChanges();
    this.backendApi
      .SubmitPost(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PostEntryReaderState.RepostPostHashHex || "" /*PostHashHexToModify*/,
        "" /*ParentPostHashHex*/,
        "" /*Title*/,
        {} /*BodyObj*/,
        this.postContent.PostHashHex,
        {},
        "" /*Sub*/,
        true /*IsHidden*/,
        // What should the fee rate be for this?
        this.globalVars.feeRateDeSoPerKB * 1e9 /*feeRateNanosPerKB*/
      )
      .subscribe(
        (response) => {
          this.globalVars.logEvent("post : unrepost");
          this.postContent.RepostCount--;
          this.postContent.PostEntryReaderState.RepostedByReader = false;
          this.sendingRepostRequest = false;
          this._detectChanges();
        },
        (err) => {
          console.error(err);
          this.sendingRepostRequest = false;
          const parsedError = this.backendApi.parsePostError(err);
          this.globalVars.logEvent("post : unrepost : error", { parsedError });
          this.globalVars._alertError(parsedError);
          this._detectChanges();
        }
      );
  }

  toggleLike(event: any) {
    if (this.inTutorial) {
      return;
    }
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
        this.globalVars.feeRateDeSoPerKB * 1e9
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
    if (this.inTutorial) {
      return;
    }
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
        // If we are quoting a post, make sure we pass the content so we don't repost a repost.
        parentPost: this.postContent,
        afterCommentCreatedCallback: isQuote ? this.afterRepostCreatedCallback : this.afterCommentCreatedCallback,
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
    if (this.inTutorial) {
      return;
    }
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

  sendDiamonds(diamonds: number, skipCelebration: boolean = false): Promise<void> {
    this.sendingDiamonds = true;
    return this.backendApi
      .SendDiamonds(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.postContent.PosterPublicKeyBase58Check,
        this.postContent.PostHashHex,
        diamonds,
        this.globalVars.feeRateDeSoPerKB * 1e9,
        this.inTutorial
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
            return this.globalVars._alertError("DeSo is under heavy load. Please try again in one minute.");
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
    comp.diamondSent.emit(null);
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

  async sendOneDiamond(event: any, fromDragEvent: boolean) {
    // Disable diamond selection if diamonds are being sent
    if (this.sendingDiamonds) {
      return;
    }

    // Block user from selecting diamond level below already gifted amount
    if (this.getCurrentDiamondLevel() > 0) {
      return;
    }

    // Don't trigger diamond purchases on tap on tablet
    if (event && event.pointerType === "touch" && !fromDragEvent) {
      event.stopPropagation();
      return;
    }

    // If triggered from mobile, stop propegation
    if (fromDragEvent) {
      event.stopPropagation();
    }

    this.onDiamondSelected(event, 0);
  }

  addDiamondSelection(event) {
    // Need to make sure hover event doesn't trigger on child elements
    if (event?.type === "initiateDrag" || event.target.id === "diamond-button") {
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
    if (!this.globalVars.loggedInUser?.PublicKeyBase58Check) {
      this.globalVars._alertError("Must be logged in to send diamonds");
      return;
    }
    // Disable diamond selection if diamonds are being sent
    if (this.sendingDiamonds) {
      return;
    }

    if (event && event.pointerType === "touch" && includes(event.target.classList, "reaction-icon")) {
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
        title: `Sending ${this.diamondSelected} diamonds to @${this.postContent.ProfileEntryResponse?.Username}`,
        html: `Clicking confirm will send ${this.globalVars.getUSDForDiamond(
          this.diamondSelected
        )} to @${this.postContent.ProfileEntryResponse?.Username}`,
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
