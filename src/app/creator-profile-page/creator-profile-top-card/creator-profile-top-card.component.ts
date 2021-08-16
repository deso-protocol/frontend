import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ViewChild, OnDestroy } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { Subscription, zip } from "rxjs";
import { map } from "rxjs/operators";
import { FollowChangeObservableResult } from "../../../lib/observable-results/follow-change-observable-result";
import { AppRoutingModule } from "../../app-routing.module";
import { FollowButtonComponent } from "../../follow-button/follow-button.component";
import { Router } from "@angular/router";
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
  followingCount: number = null;
  refreshFollowingBeingCalled = false;
  publicKeyIsCopied = false;

  constructor(private _globalVars: GlobalVarsService, private backendApi: BackendApiService, private router: Router) {
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

  reportUser(): void {
    this.globalVars.logEvent("post : report-user");
    window.open(
      `https://report.bitclout.com/account?ReporterPublicKey=${this.globalVars.loggedInUser?.PublicKeyBase58Check}&ReportedAccountPublicKey=${this.profile.PublicKeyBase58Check}`
    );
  }

  updateWellKnownCreatorsList(): void {
    this.updateCreatorFeaturedTutorialList(true, this.profile.IsFeaturedTutorialWellKnownCreator);
  }

  updateUpAndComingCreatorsList(): void {
    this.updateCreatorFeaturedTutorialList(false, this.profile.IsFeaturedTutorialUpAndComingCreator);
  }

  updateCreatorFeaturedTutorialList(isWellKnown: boolean, isRemoval: boolean) {
    this.backendApi
      .AdminUpdateTutorialCreators(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.profile.PublicKeyBase58Check,
        isRemoval,
        isWellKnown
      )
      .subscribe(
        (res) => {
          if (isWellKnown) {
            this.profile.IsFeaturedTutorialWellKnownCreator = !isRemoval;
          } else {
            this.profile.IsFeaturedTutorialUpAndComingCreator = !isRemoval;
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }

  messageUser(): void {
    this.router.navigate(["/" + this.globalVars.RouteNames.INBOX_PREFIX], {
      queryParams: { username: this.profile.Username },
      queryParamsHandling: "merge",
    });
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

  // Here we're making two calls to fetch one follower and one followed user (and their profiles),
  // but we only need the counts. Maybe we should allow the GetFollows response to return only
  // the counts, and maybe both at once.
  _refreshFollowing() {
    if (this.refreshFollowingBeingCalled) {
      return;
    }

    this.refreshFollowingBeingCalled = true;

    // TODO: need a loading treatment while loading OR need to obtain all follows on pageload

    const getFollowers = this.backendApi
      .GetFollows(
        this.globalVars.localNode,
        this.profile.Username,
        "" /* PublicKeyBase58Check */,
        true /* get followers */,
        "" /* GetEntriesFollowingUsername */,
        0 /* NumToFetch */
      )
      .pipe(map((res) => res.NumFollowers));

    const getFollowing = this.backendApi
      .GetFollows(
        this.globalVars.localNode,
        this.profile.Username,
        "" /* PublicKeyBase58Check */,
        false /* get following */,
        "" /* GetEntriesFollowingUsername */,
        0 /* NumToFetch */
      )
      .pipe(map((res) => res.NumFollowers));

    zip(getFollowers, getFollowing).subscribe(
      (res) => {
        this.followerCount = res[0];
        this.followingCount = res[1];
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

  getFoundersRewardPercent() {
    return this.profile.CoinEntry.CreatorBasisPoints / 100;
  }
}
