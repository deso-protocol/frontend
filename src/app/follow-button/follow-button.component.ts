// Note: follow buttons are completely independent. This means that if you have
// two buttons for the same person on a page, and you follow using one button,
// the second button will not update (it will still say "Follow"). I think it's
// possible this "two button" situation can arise on the followers/following tabs
// if you're following someone who follows you.
// TODO: fix this ^^

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, User } from "../backend-api.service";
import { Input } from "@angular/core";
import { FollowChangeObservableResult } from "../../lib/observable-results/follow-change-observable-result";
import { Subscription } from "rxjs";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";

@Component({
  selector: "follow-button",
  templateUrl: "./follow-button.component.html",
  styleUrls: ["./follow-button.component.scss"],
})
export class FollowButtonComponent implements OnInit, OnDestroy {
  RULE_ERROR_FOLLOW_ENTRY_ALREADY_EXISTS = "RuleErrorFollowEntryAlreadyExists";
  RULE_ERROR_CANNOT_UNFOLLOW_NONEXISTENT_FOLLOW_ENTRY = "RuleErrorCannotUnfollowNonexistentFollowEntry";

  @Input() followedPubKeyBase58Check: string;
  @Input() displayAsLink: boolean;
  @Input() unfollowButtonClasses = [];
  @Input() followButtonClasses = [];
  @Input() followLinkClass;

  // Is the logged in user currently following the target person?
  isFollowing: boolean;
  appData: GlobalVarsService;
  createFollowTxnBeingCalled = false;
  followChangeSubscription: Subscription;
  changeRef: ChangeDetectorRef;

  unfollow(event) {
    if (event) {
      event.stopPropagation();
    }
    this._toggleFollow(false);
  }

  follow(event) {
    event.stopPropagation();
    this._toggleFollow(true);
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

  _handleSuccessfulFollow() {
    this.globalVars.logEvent("user : follow");

    // add to the list of follows (keep the global list correct)
    let publicKeys = this.appData.loggedInUser.PublicKeysBase58CheckFollowedByUser;
    let index = publicKeys.indexOf(this.followedPubKeyBase58Check);
    if (index == -1) {
      publicKeys.push(this.followedPubKeyBase58Check);
      // we keep the array sorted since app.component.ts does the following
      // to determine whether any user fields are changed:
      //   (JSON.stringify(this.appData.loggedInUser) !== JSON.stringify(loggedInUserFound))
      publicKeys.sort();
    } else {
      // Note: this "unexpected" index can happen on the global feed if the user clicks
      // separate follow buttons on multiple feed items by the same person at the same time
      console.error(`_handleSuccessfulUnfollow: unexpected index: ${index}`);
    }
    this.isFollowing = true;
  }

  _handleSuccessfulUnfollow() {
    this.globalVars.logEvent("user : unfollow");

    // remove from the list of follows (keep the global list correct)
    let publicKeys = this.appData.loggedInUser.PublicKeysBase58CheckFollowedByUser;
    let index = publicKeys.indexOf(this.followedPubKeyBase58Check);
    if (index > -1) {
      publicKeys.splice(index, 1);
      publicKeys.sort();
    } else {
      // Note: this "unexpected" index can happen on the global feed if the user clicks
      // separate unfollow buttons on multiple feed items by the same person at the same time
      console.error(`_handleSuccessfulUnfollow: unexpected index: ${index}`);
    }
    this.isFollowing = false;
    this.changeRef.detectChanges();
  }

  _handleSuccessfulFollowTxn(isFollow) {
    if (isFollow) {
      this._handleSuccessfulFollow();
    } else {
      this._handleSuccessfulUnfollow();
    }
  }

  // Note: only the follow button that calls CreateFollowTxn should notify. Any
  // other buttons that update their state should not notify.
  _notifyFollowChangeObservers() {
    this.appData.followChangeObservers.forEach((observer) => {
      let result = new FollowChangeObservableResult();
      result.isFollowing = this.isFollowing;
      result.followedPubKeyBase58Check = this.followedPubKeyBase58Check;
      observer.next(result);
    });
  }

  _toggleFollow(isFollow) {
    if (this.createFollowTxnBeingCalled) {
      return;
    }

    let followerPublicKeyBase58Check = this.appData.loggedInUser.PublicKeyBase58Check;

    this.createFollowTxnBeingCalled = true;
    // Need to manually detect changes, since the follow button can rendered from the feed
    // (which has change detection disabled)
    this.changeRef.detectChanges();

    this.backendApi
      .CreateFollowTxn(
        this.appData.localNode,
        followerPublicKeyBase58Check,
        this.followedPubKeyBase58Check,
        !isFollow /*isUnfollow*/,
        this.appData.feeRateBitCloutPerKB * 1e9
      )
      .subscribe(
        (response) => {
          this._handleSuccessfulFollowTxn(isFollow);
          this._notifyFollowChangeObservers();
        },
        (response) => {
          console.error(response);
          let errorString = response.error.error || "";
          if (errorString.includes(this.RULE_ERROR_FOLLOW_ENTRY_ALREADY_EXISTS)) {
            // If the user is already following, then set our button to reflect that.
            // Note: a common way this can currently happen is if there are multiple
            // follow buttons on the same page for the same user. TODO: fix this
            this._handleSuccessfulFollow();
          } else if (errorString.includes(this.RULE_ERROR_CANNOT_UNFOLLOW_NONEXISTENT_FOLLOW_ENTRY)) {
            // If the user is already not following, then set our button to reflect that.
            this._handleSuccessfulUnfollow();
          } else {
            // TODO: RuleErrorInputSpendsNonexistentUtxo is a problem ... we need a lock in the server endpoint
            // TODO: there's prob some "out of funds" error which is a problem
            const parsedError = this.backendApi.parseMessageError(response);
            this.globalVars.logEvent(`user : ${isFollow ? "follow" : "unfollow"} : error`, { parsedError });
            this.appData._alertError(parsedError);
          }
        }
      )
      .add(() => {
        this.createFollowTxnBeingCalled = false;

        // Need to manually detect changes, since the follow button can rendered from the feed
        // (which has change detection disabled)
        this.changeRef.detectChanges();
      });
  }

  _isLoggedInUserFollowing() {
    if (!this.appData.loggedInUser?.PublicKeysBase58CheckFollowedByUser) {
      return false;
    }

    return this.appData.loggedInUser.PublicKeysBase58CheckFollowedByUser.includes(this.followedPubKeyBase58Check);
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
    private backendApi: BackendApiService
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
    this.isFollowing = this._isLoggedInUserFollowing();
  }
}
