import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { PostEntryResponse } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { PlatformLocation } from "@angular/common";

@Component({
  selector: "feed-post-dropdown",
  templateUrl: "./feed-post-dropdown.component.html",
  styleUrls: ["./feed-post-dropdown.component.sass"],
})
export class FeedPostDropdownComponent {
  @Input() post: PostEntryResponse;
  @Input() postContent: PostEntryResponse;

  @Output() postHidden = new EventEmitter();
  @Output() userBlocked = new EventEmitter();
  @Output() toggleGlobalFeed = new EventEmitter();
  @Output() togglePostPin = new EventEmitter();

  constructor(
    public globalVars: GlobalVarsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private platformLocation: PlatformLocation
  ) {}

  reportPost(): void {
    this.globalVars.logEvent("post : report-content");
    window.open(
      `https://report.bitclout.com?ReporterPublicKey=${this.globalVars.loggedInUser?.PublicKeyBase58Check}&PostHash=${this.post.PostHashHex}`
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

  _getPostUrl() {
    const pathArray = ["/" + this.globalVars.RouteNames.POSTS, this.postContent.PostHashHex];

    // need to preserve the curent query params for our dev env to work
    const currentQueryParams = this.activatedRoute.snapshot.queryParams;

    const path = this.router.createUrlTree(pathArray, { queryParams: currentQueryParams }).toString();
    const origin = (this.platformLocation as any).location.origin;

    return origin + path;
  }
}
