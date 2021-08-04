import { ChangeDetectorRef, Injectable} from "@angular/core";
import { BackendApiService } from "../backend-api.service";
import { FollowChangeObservableResult } from "../../lib/observable-results/follow-change-observable-result";
import { GlobalVarsService } from "../global-vars.service";

@Injectable({
  providedIn: "root",
})
export class FollowService {
  constructor(
    private followedPubKeyBase58Check: string,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private appData: GlobalVarsService,
    private changeRef: ChangeDetectorRef
  ) {}

  RULE_ERROR_FOLLOW_ENTRY_ALREADY_EXISTS = "RuleErrorFollowEntryAlreadyExists";
  RULE_ERROR_CANNOT_UNFOLLOW_NONEXISTENT_FOLLOW_ENTRY = "RuleErrorCannotUnfollowNonexistentFollowEntry";
  createFollowTxnBeingCalled = false;
  isFollowing: boolean;

  _isLoggedInUserFollowing() {
    if (!this.appData.loggedInUser?.PublicKeysBase58CheckFollowedByUser) {
      return false;
    }

    return this.appData.loggedInUser.PublicKeysBase58CheckFollowedByUser.includes(this.followedPubKeyBase58Check);
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
            this.appData._alertError(parsedError, !!parsedError.indexOf("insufficient"));
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

  _handleSuccessfulFollowTxn(isFollow) {
    if (isFollow) {
      this._handleSuccessfulFollow();
    } else {
      this._handleSuccessfulUnfollow();
    }
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
}
