import { Component, OnDestroy, OnInit } from "@angular/core";
import { BackendApiService, ProfileEntryResponse } from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { RouteNames, AppRoutingModule } from "../../app-routing.module";
import { CanPublicKeyFollowTargetPublicKeyHelper } from "../../../lib/helpers/follows/can_public_key_follow_target_public_key_helper";
import { Datasource, IAdapter, IDatasource } from "ngx-ui-scroll";

@Component({
  selector: "manage-follows",
  templateUrl: "./manage-follows.component.html",
  styleUrls: ["./manage-follows.component.scss"],
})
export class ManageFollowsComponent implements OnDestroy {
  static FOLLOWING = "Following";
  static FOLLOWERS = "Followers";
  static PAGE_SIZE = 50;

  ManageFollowsComponent = ManageFollowsComponent;
  AppRoutingModule = AppRoutingModule;
  router: Router;
  appData: GlobalVarsService;
  activeTab: string;

  // TODO: pretty sure this is misnamed. It can also be followerPublicKeyToProfileEntry.
  followedPublicKeyToProfileEntry: {};
  getEntriesFollowingPublicKey: boolean;
  targetUsername: string;
  loggedInUserSubscription: Subscription;

  totalFollowerCount: number = 0;
  anonymousFollowerCount: number = 0;
  profileFollowerCount: number = 0;
  loadingFirstPage = true;
  loadingNextPage = false;

  pagedKeys = {
    0: "",
  };

  pagedRequests = {
    "-1": new Promise((resolve) => {
      resolve([]);
    }),
  };

  lastPage = null;

  // TODO: Cleanup - Create InfiniteScroller class to de-duplicate this logic
  datasource: IDatasource<IAdapter<any>> = new Datasource<IAdapter<any>>({
    get: (index, count, success) => {
      const startIdx = Math.max(index, 0);
      const endIdx = index + count - 1;
      if (startIdx > endIdx) {
        success([]);
        return;
      }

      const startPage = Math.floor(startIdx / ManageFollowsComponent.PAGE_SIZE);
      const endPage = Math.floor(endIdx / ManageFollowsComponent.PAGE_SIZE);

      const pageRequests: any[] = [];
      for (let i = startPage; i <= endPage; i++) {
        const existingRequest = this.pagedRequests[i];
        if (existingRequest) {
          pageRequests.push(existingRequest);
        } else {
          const newRequest = this.pagedRequests[i - 1].then((_) => {
            return this.getPage(i);
          });
          this.pagedRequests[i] = newRequest;
          pageRequests.push(newRequest);
        }
      }

      return Promise.all(pageRequests).then((pageResults) => {
        pageResults = pageResults.reduce((acc, result) => [...acc, ...result], []);
        const start = startIdx - startPage * ManageFollowsComponent.PAGE_SIZE;
        const end = start + endIdx - startIdx + 1;
        return pageResults.slice(start, end);
      });
    },
    settings: {
      startIndex: 0,
      minIndex: 0,
      bufferSize: 50,
      windowViewport: true,
      infinite: true,
    },
  });

  getPage(page: number) {
    if (this.lastPage != null && page > this.lastPage) {
      return [];
    }
    this.loadingNextPage = true;
    const fetchPubKey = this.pagedKeys[page];
    // Get next page of follows using the last public key seen, as defined by fetchPubKey
    return this.backendApi
      .GetFollows(
        this.appData.localNode,
        this.targetUsername,
        "" /* PublicKeyBase58Check */,
        this.getEntriesFollowingPublicKey,
        fetchPubKey,
        ManageFollowsComponent.PAGE_SIZE
      )
      .toPromise()
      .then((res) => {
        // always set the total follower count.
        this.totalFollowerCount = res.NumFollowers;
        const chunk = res.PublicKeyToProfileEntry;
        // Filter out null / undefined values and sort by coin price.
        const sortedProfileEntries: ProfileEntryResponse[] = (Object.values(chunk) as ProfileEntryResponse[])
          .filter((val) => val)
          .sort((ii: any, jj: any) => jj.CoinEntry.BitCloutLockedNanos - ii.CoinEntry.BitCloutLockedNanos);

        if (sortedProfileEntries.length > 0) {
          // Set pagedKeys so we have the last public key for the next page.
          this.pagedKeys[page + 1] = sortedProfileEntries[sortedProfileEntries.length - 1].PublicKeyBase58Check;
        } else {
          this.pagedKeys[page + 1] = "";
        }
        // Increment profile follower count -- maintained so we can compute anonymous followers at the end.
        this.profileFollowerCount += sortedProfileEntries.length;
        // If we've hit the end of the followers with profiles, set last page and anonymous follower count.
        if (sortedProfileEntries.length < ManageFollowsComponent.PAGE_SIZE || this.pagedKeys[page + 1] === "") {
          this.lastPage = page;
          this.anonymousFollowerCount = res.NumFollowers - this.profileFollowerCount;
        }
        // Set loading variables to false.
        this.loadingNextPage = false;
        this.loadingFirstPage = false;
        // Return the sorted profile entries.
        return sortedProfileEntries;
      });
  }

  _handleTabClick(tabName) {
    let routeSuffix;
    if (tabName === ManageFollowsComponent.FOLLOWING) {
      routeSuffix = RouteNames.FOLLOWING;
    } else if (tabName === ManageFollowsComponent.FOLLOWERS) {
      routeSuffix = RouteNames.FOLLOWERS;
    } else {
      // TODO: rollbar
      console.error(`unrecognized tabName: ${tabName}`);
    }

    this.router.navigate([RouteNames.USER_PREFIX, this.targetUsername, routeSuffix], { queryParamsHandling: "merge" });
  }

  _setStateFromActivatedRoute(route) {
    // get the username of the target user (user whose followers / following we're obtaining)
    this.targetUsername = route.snapshot.params.username;

    // set a variable about whether we're obtaining the target user's followers or following
    // route.snapshot.url[1] /u/, url[2] is the username, url[3] is either 'following' or 'followers'
    let followingParamIndex = 2;
    let path = route.snapshot.url[followingParamIndex].path;
    switch (path) {
      case this.appData.RouteNames.FOLLOWING: {
        this.getEntriesFollowingPublicKey = false;
        this.activeTab = ManageFollowsComponent.FOLLOWING;
        break;
      }
      case this.appData.RouteNames.FOLLOWERS: {
        this.getEntriesFollowingPublicKey = true;
        this.activeTab = ManageFollowsComponent.FOLLOWERS;
        break;
      }
      default: {
        // unexpected state
        console.error(`unexpected path in _setStateFromActivatedRoute: ${path}`);
        // TODO: rollbar
      }
    }
  }

  canLoggedInUserFollowTargetPublicKey(targetPubKeyBase58Check) {
    return CanPublicKeyFollowTargetPublicKeyHelper.execute(
      this.appData.loggedInUser?.PublicKeyBase58Check,
      targetPubKeyBase58Check
    );
  }

  onRowClicked(event, username: string) {
    // don't navigate if the user is selecting text
    // from https://stackoverflow.com/questions/31982407/prevent-onclick-event-when-selecting-text
    var selection = window.getSelection();
    if (selection.toString().length !== 0) {
      return true;
    }

    // don't navigate if the user clicked a link
    if (event.target.tagName.toLowerCase() === "a") {
      return true;
    }

    this.router.navigate([RouteNames.USER_PREFIX, username], { queryParamsHandling: "merge" });
  }

  constructor(
    private globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService
  ) {
    this.router = _router;
    this.appData = globalVars;

    // Start obtaining the following data once we have a loggedInUser
    this.loggedInUserSubscription = this.appData.loggedInUserObservable.subscribe((loggedInUserObservableResult) => {
      // Only refresh if the current loggedInUser is different than the last
      // one. If we don't do this, then every time we unfollow someone,
      // the unfollowed user may disappear from the followed list, which isn't what
      // we want. Instead, we want the unfollowed user to remain in the followed list
      // until page refresh, so that the loggedInUser has a chance to re-follow if he misclicked.
      //
      // This can happen since the User data that app.component pulls from the server
      // contains the follower list, and that data can look different then the client-side
      // follower list, and so app.component will think that the user has been updated
      // and try to set a new logged in user.
      //
      // In theory, this shouldn't happen, since the frontend and backend aim to
      // update and sort the follower lists identically, but I've seen weird behavior
      // here, so I'm just being defensive.
      //
      // ^^ I'm guessing "weird behavior" is due to other pieces of user data (unrelated
      // to follows) being out of sync between the frontend and backend (either not updated
      // appropriately or not sorted).
      if (!loggedInUserObservableResult.isSameUserAsBefore) {
        this.datasource.get(0, ManageFollowsComponent.PAGE_SIZE, null);
      }
    });

    this.route.params.subscribe((params) => {
      window.scroll(0, 0);
      this._setStateFromActivatedRoute(route);

      // loggedInUserSubscription isn't triggered on pageload, so need to call this manually
      this.datasource.get(0, ManageFollowsComponent.PAGE_SIZE, null);
    });
  }

  ngOnDestroy() {
    this.loggedInUserSubscription.unsubscribe();
  }
}
