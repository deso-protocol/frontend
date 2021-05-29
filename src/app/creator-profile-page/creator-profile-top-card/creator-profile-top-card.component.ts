import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, OnDestroy } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { Subscription } from "rxjs";
import { FollowChangeObservableResult } from "../../../lib/observable-results/follow-change-observable-result";
import { AppRoutingModule } from "../../app-routing.module";
import { FollowButtonComponent } from "../../follow-button/follow-button.component";

@Component({
  selector: "creator-profile-top-card",
  templateUrl: "./creator-profile-top-card.component.html",
  styleUrls: ["./creator-profile-top-card.component.scss"],
})
export class CreatorProfileTopCardComponent implements OnInit, OnDestroy {
  @ViewChild(FollowButtonComponent, { static: false }) childFollowComponent;

  @Input() profile: any;

  // emits the UserUnblocked event
  @Output() userUnblocked = new EventEmitter();

  // emits the UserUnblocked event
  @Output() userBlocked = new EventEmitter();

  AppRoutingModule = AppRoutingModule;
  globalVars: GlobalVarsService;
  followChangeSubscription: Subscription;
  followerCount: number = null;
  refreshFollowingBeingCalled = false;
  publicKeyIsCopied = false;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService) {
    this.globalVars = _globalVars;

    // If the user follows/unfollows this user, update the follower count
    this.followChangeSubscription = this.globalVars.followChangeObservable.subscribe((followChangeObservableResult) => {
      this._handleFollowChangeObservableResult(followChangeObservableResult);
    });
  }

  profileBelongsToLoggedInUser(): boolean {
    return (
      this.globalVars.loggedInUser?.ProfileEntryResponse &&
      this.globalVars.loggedInUser.ProfileEntryResponse.PublicKeyBase58Check === this.profile.PublicKeyBase58Check
    );
  }

  ngOnDestroy() {
    this.followChangeSubscription.unsubscribe();
  }

  ngOnInit() {
    this._refreshFollowing();
  }

  unblock() {
    this.userUnblocked.emit(this.profile.PublicKeyBase58Check);
  }

  block() {
    this.userBlocked.emit(this.profile.PublicKeyBase58Check);
  }

  coinsInCirculation() {
    return this.profile.CoinEntry.CoinsInCirculationNanos / 1e9;
  }

  usdMarketCap() {
    return this.globalVars.abbreviateNumber(
      this.globalVars.nanosToUSDNumber(this.coinsInCirculation() * this.profile.CoinPriceBitCloutNanos),
      3,
      true
    );
  }

  totalUSDLocked() {
    return this.globalVars.abbreviateNumber(
      this.globalVars.nanosToUSDNumber(this.profile.CoinEntry.BitCloutLockedNanos),
      3,
      true
    );
  }

  _handleFollowChangeObservableResult(followChangeObservableResult: FollowChangeObservableResult) {
    if (followChangeObservableResult.followedPubKeyBase58Check === this.profile.PublicKeyBase58Check) {
      if (followChangeObservableResult.isFollowing) {
        this.followerCount += 1;
      } else {
        this.followerCount -= 1;
      }
    }
  }

  _copyPublicKey() {
    this.globalVars._copyText(this.profile.PublicKeyBase58Check);
    this.publicKeyIsCopied = true;
    setInterval(() => {
      this.publicKeyIsCopied = false;
    }, 1000);
  }

  // Here we're fetching all followers (and their profiles), but we only need the followers
  // for the follower count. Maybe we should just put the follower count as an attribute on
  // the GetUsers response. Not sure
  _refreshFollowing() {
    if (this.refreshFollowingBeingCalled) {
      return;
    }

    this.refreshFollowingBeingCalled = true;

    // TODO: need a loading treatment while loading OR need to obtain all follows on pageload

    this.backendApi
      .GetFollows(
        this.globalVars.localNode,
        this.profile.Username,
        "" /* PublicKeyBase58Check */,
        true /* get followers */
      )
      .subscribe(
        (response) => {
          this.followerCount = response.NumFollowers;
          this.refreshFollowingBeingCalled = false;
        },
        (error) => {
          this.refreshFollowingBeingCalled = false;
          // fail silently
          console.error(error);
        }
      );
  }

  _isLoggedInUserFollowing() {
    if (!this.globalVars.loggedInUser?.PublicKeysBase58CheckFollowedByUser) {
      return false;
    }

    return this.globalVars.loggedInUser.PublicKeysBase58CheckFollowedByUser.includes(this.profile.PublicKeyBase58Check);
  }

  // When a user blocks a profile, we make sure to unfollow that profile if the user is currently following it.
  _unfollowIfBlocked() {
    if (this._isLoggedInUserFollowing()) {
      this.childFollowComponent.unfollow();
    }
  }
}
