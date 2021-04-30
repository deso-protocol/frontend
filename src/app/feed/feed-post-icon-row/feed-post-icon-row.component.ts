import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, PostEntryResponse } from "../../backend-api.service";
import { SharedDialogs } from "../../../lib/shared-dialogs";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { RouteNames } from "../../app-routing.module";
import { BsModalService } from "ngx-bootstrap/modal";
import { CommentModalComponent } from "../../comment-modal/comment-modal.component";

@Component({
  selector: "feed-post-icon-row",
  templateUrl: "./feed-post-icon-row.component.html",
  styleUrls: ["./feed-post-icon-row.component.sass"],
})
export class FeedPostIconRowComponent {
  @Input() post: PostEntryResponse;
  @Input() postContent: PostEntryResponse;
  @Input() parentPost: PostEntryResponse;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() afterRecloutCreatedCallback: any = null;

  globalVars: GlobalVarsService;
  sendingRecloutRequest = false;

  constructor(
    private _globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private platformLocation: PlatformLocation,
    private ref: ChangeDetectorRef,
    private modalService: BsModalService
  ) {
    this.globalVars = _globalVars;
  }

  _detectChanges() {
    this.ref.detectChanges();
  }

  _preventNonLoggedInUserActions(action: string) {
    this.globalVars.logEvent(`alert : ${action} : account`);

    return SwalHelper.fire({
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
        this.router.navigate(["/" + RouteNames.SIGN_UP], { queryParamsHandling: "merge" });
      }
    });
  }

  userHasReclouted(): boolean {
    return this.postContent.PostEntryReaderState && this.postContent.PostEntryReaderState.RecloutedByReader;
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
        0 /*CreatorBasisPoints*/,
        // What does this do??
        1.25 * 100 * 100 /*StakeMultipleBasisPoints*/,
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
        0 /*CreatorBasisPoints*/,
        // What does this do??
        1.25 * 100 * 100 /*StakeMultipleBasisPoints*/,
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
      SharedDialogs.showCreateAccountToPostDialog(this.router);
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

  // this is a bit of a hacky solution, not sure what the right way to do this is
  //
  // this solution is from https://stackoverflow.com/questions/41447305/how-to-get-an-absolute-url-by-a-route-name-in-angular-2
  // which got its answer from https://stackoverflow.com/questions/38485171/angular-2-access-base-href
  // but the angular docs say not to use PlatformLocation https://angular.io/api/common/PlatformLocation
  // maybe we should just use window.location.href instead...
  _getPostUrl() {
    const pathArray = ["/" + this.globalVars.RouteNames.POSTS, this.postContent.PostHashHex];

    // need to preserve the curent query params for our dev env to work
    const currentQueryParams = this.activatedRoute.snapshot.queryParams;

    const path = this.router.createUrlTree(pathArray, { queryParams: currentQueryParams }).toString();
    const origin = (this.platformLocation as any).location.origin;

    return origin + path;
  }
}
