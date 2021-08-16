// Note: follow buttons are completely independent. This means that if you have
// two buttons for the same person on a page, and you follow using one button,
// the second button will not update (it will still say "Follow"). I think it's
// possible this "two button" situation can arise on the followers/following tabs
// if you're following someone who follows you.
// TODO: fix this ^^

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { Input } from "@angular/core";
import { FollowChangeObservableResult } from "../../lib/observable-results/follow-change-observable-result";
import { Subscription } from "rxjs";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { FollowService } from "../../lib/services/follow/follow.service";

@Component({
  selector: "follow-button",
  templateUrl: "./follow-button.component.html",
  styleUrls: ["./follow-button.component.scss"],
})
export class FollowButtonComponent implements OnInit, OnDestroy {
  @Input() followedPubKeyBase58Check: string;
  @Input() displayAsLink: boolean;
  @Input() unfollowButtonClasses = [];
  @Input() followButtonClasses = [];
  @Input() followLinkClass;
  @Input() creatorCoinTemplate;

  // Is the logged in user currently following the target person?
  isFollowing: boolean;
  appData: GlobalVarsService;
  createFollowTxnBeingCalled = false;
  followChangeSubscription: Subscription;
  changeRef: ChangeDetectorRef;

  _makeFollowTransaction(event, isFollow: boolean) {
    this.createFollowTxnBeingCalled = true;
    event.stopPropagation();
    this.followService._toggleFollow(isFollow, this.followedPubKeyBase58Check).add(() => {
      this.createFollowTxnBeingCalled = false;
      // Need to manually detect changes, since the follow button can rendered from the feed
      // (which has change detection disabled)
      this.changeRef.detectChanges();
    });
  }

  unfollow(event) {
    this._makeFollowTransaction(event, false);
  }

  follow(event) {
    this._makeFollowTransaction(event, true);
  }

  canLoggedInUserFollowTargetPublicKey() {
    if (!this.appData.loggedInUser) {
      return false;
    }

    return CanPublicKeyFollowTargetPublicKeyHelper.execute(
      this.appData.loggedInUser.PublicKeyBase58Check,
      this.followedPubKeyBase58Check
    );
  }

  getFollowButtonClasses() {
    let classes = [...this.followButtonClasses]; // create a shallow copy of the classes
    if (this.createFollowTxnBeingCalled) {
      classes.push("btn-loading");
    }
    return classes;
  }

  getUnfollowButtonClasses() {
    let classes = [...this.unfollowButtonClasses]; // create a shallow copy of the classes
    if (this.createFollowTxnBeingCalled) {
      classes.push("btn-loading");
    }
    return classes;
  }

  _handleFollowChangeObservableResult(followChangeObservableResult: FollowChangeObservableResult) {
    if (followChangeObservableResult.followedPubKeyBase58Check == this.followedPubKeyBase58Check) {
      this.isFollowing = followChangeObservableResult.isFollowing;

      // Need to manually detect changes, since the follow button can rendered from the feed
      // (which has change detection disabled)
      this.changeRef.detectChanges();
    }
  }

  constructor(
    private globalVars: GlobalVarsService,
    private _changeRef: ChangeDetectorRef,
    private backendApi: BackendApiService,
    private followService: FollowService
  ) {
    this.appData = globalVars;
    this.changeRef = _changeRef;

    // If the user follows/unfollows via another button, update this button as well
    // This handles the case where we have multiple buttons for the same followed-person
    // on the same page
    this.followChangeSubscription = this.appData.followChangeObservable.subscribe((followChangeObservableResult) => {
      this._handleFollowChangeObservableResult(followChangeObservableResult);
    });
  }

  ngOnDestroy() {
    this.followChangeSubscription.unsubscribe();
  }

  ngOnInit() {
    this.isFollowing = this.followService._isLoggedInUserFollowing(this.followedPubKeyBase58Check);
  }
}
