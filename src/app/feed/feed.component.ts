import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef, AfterViewChecked } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService } from "../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { tap, finalize, first } from "rxjs/operators";
import * as _ from "lodash";
import PullToRefresh from "pulltorefreshjs";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "feed",
  templateUrl: "./feed.component.html",
  styleUrls: ["./feed.component.sass"],
})
export class FeedComponent implements OnInit, OnDestroy, AfterViewChecked {
  static GLOBAL_TAB = "Global";
  static FOLLOWING_TAB = "Following";
  static MARKET_TAB = "Market";
  static TABS = [FeedComponent.GLOBAL_TAB, FeedComponent.FOLLOWING_TAB];
  static NUM_TO_FETCH = 50;
  static MIN_FOLLOWING_TO_SHOW_FOLLOW_FEED_BY_DEFAULT = 10;
  static PULL_TO_REFRESH_MARKER_ID = "pull-to-refresh-marker";

  @Input() activeTab: string;
  @Input() isMobile = false;

  loggedInUserSubscription: Subscription;
  followChangeSubscription: Subscription;
  FeedComponent = FeedComponent;
  switchingTabs = false;

  followedPublicKeyToProfileEntry = {};

  // We load the first batch of follow feed posts on page load and whenever the user follows someone
  loadingFirstBatchOfFollowFeedPosts = false;

  // We load the first batch of global feed posts on page load
  loadingFirstBatchOfGlobalFeedPosts = false;

  // We load the user's following on page load. This boolean tracks whether we're currently loading
  // or whether we've finished.
  isLoadingFollowingOnPageLoad;

  globalVars: GlobalVarsService;
  followFeedPosts = []; // array of PostEntrys
  serverHasMoreFollowFeedPosts = true;
  serverHasMoreGlobalFeedPosts = true;
  loadingMoreFollowFeedPosts = false;
  loadingMoreGlobalFeedPosts = false;

  pullToRefreshHandler;

  // This is [Following, Global, Market] if the user is following anybody. Otherwise,
  // it's [Global, Following, Market].
  //
  // TODO: if you switch between accounts while viewing the feed, we don't recompute this.
  // So if user1 is following folks, and we switch to user2 who isn't following anyone,
  // the empty follow feed will be the first tab (which is incorrect) and
  feedTabs = [];

  constructor(
    private appData: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private backendApi: BackendApiService,
    private titleService: Title
  ) {
    this.globalVars = appData;

    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.feedTab) {
        this.activeTab = queryParams.feedTab;
      } else {
        // A default activeTab will be set after we load the follow feed (based on whether
        // the user is following anybody)
        this.activeTab = null;
      }
    });

    // Reload the follow feed any time the user follows / unfollows somebody
    this.followChangeSubscription = this.appData.followChangeObservable.subscribe((followChangeObservableResult) => {
      this._reloadFollowFeed();
    });

    this.loggedInUserSubscription = this.appData.loggedInUserObservable.subscribe((loggedInUserObservableResult) => {
      // Reload the follow feed if the logged in user changed
      if (!loggedInUserObservableResult.isSameUserAsBefore) {
        // Set activeTab to null so that a sensible default tab is selected
        this.activeTab = null;
        this._initializeFeeds();
      }
    });
  }

  ngOnInit() {
    this._initializeFeeds();
    this.titleService.setTitle("Feed - BitClout");
  }

  ngAfterViewChecked() {
    // if the marker was removed for some reason,
    // then clear out the handler to allow it to be recreated later
    if (!document.getElementById(this.getPullToRefreshMarkerId())) {
      this.pullToRefreshHandler?.destroy();
      this.pullToRefreshHandler = undefined;
    } else if (!this.pullToRefreshHandler) {
      // initialize the handler only once when the
      // marker is first created
      this.pullToRefreshHandler = PullToRefresh.init({
        mainElement: `#${this.getPullToRefreshMarkerId()}`,
        onRefresh: () => {
          const globalPostsPromise = this._loadPosts(true);
          const followPostsPromise = this._loadFollowFeedPosts(true);
          return this.activeTab === FeedComponent.FOLLOWING_TAB ? followPostsPromise : globalPostsPromise;
        },
      });
    }
  }

  ngOnDestroy() {
    this.pullToRefreshHandler?.destroy();
    this.loggedInUserSubscription.unsubscribe();
    this.followChangeSubscription.unsubscribe();
  }

  _reloadFollowFeed() {
    // Reload the follow feed from scratch
    this.followFeedPosts = [];
    this.loadingFirstBatchOfFollowFeedPosts = true;
    return this._loadFollowFeedPosts();
  }

  _initializeFeeds() {
    if (this.globalVars.postsToShow.length === 0) {
      // Get some posts to show the user.
      this.loadingFirstBatchOfGlobalFeedPosts = true;
      this._loadPosts();
    } else {
      // If we already have posts to show, delay rendering the posts for a hot second so nav is fast.
      // this._onTabSwitch()
    }

    // Request the follow feed (so we have it ready for display if needed)
    this._reloadFollowFeed();

    // The activeTab is set after we load the following based on whether the user is
    // already following anybody
    if (this.appData.loggedInUser) {
      this._loadFollowing();
    } else {
      // If there's no user, consider the following to be loaded (it's empty)
      this._afterLoadingFollowingOnPageLoad();
    }
  }

  getPullToRefreshMarkerId() {
    return FeedComponent.PULL_TO_REFRESH_MARKER_ID;
  }

  prependPostToFeed(postEntryResponse) {
    FeedComponent.prependPostToFeed(this.postsToShow(), postEntryResponse);
  }

  onPostHidden(postEntryResponse) {
    const parentPostIndex = FeedComponent.findParentPostIndex(this.postsToShow(), postEntryResponse);
    const parentPost = this.postsToShow()[parentPostIndex];

    FeedComponent.onPostHidden(
      this.postsToShow(),
      postEntryResponse,
      parentPost,
      null /*grandparentPost... don't worry about them on the feed*/
    );

    // Remove / re-add the parentPost from postsToShow, to force
    // angular to re-render now that we've updated the comment count
    this.postsToShow()[parentPostIndex] = _.cloneDeep(parentPost);
  }

  userBlocked() {
    this.cdr.detectChanges();
  }

  appendCommentAfterParentPost(postEntryResponse) {
    FeedComponent.appendCommentAfterParentPost(this.postsToShow(), postEntryResponse);
  }

  hideFollowLink() {
    return this.activeTab === FeedComponent.FOLLOWING_TAB;
  }

  postsToShow() {
    if (this.activeTab === FeedComponent.FOLLOWING_TAB) {
      // No need to delay on the Following tab. It handles the "slow switching" issue itself.
      return this.followFeedPosts;
    } else {
      return this.globalVars.postsToShow;
    }
  }

  activeTabReadyForDisplay() {
    // If we don't have the following yet, we don't even know which tab to display
    if (this.isLoadingFollowingOnPageLoad) {
      return false;
    }

    if (this.activeTab === FeedComponent.FOLLOWING_TAB) {
      // No need to delay on the Following tab. It handles the "slow switching" issue itself.
      return this.loadingMoreFollowFeedPosts;
    } else {
      return this.loadingMoreGlobalFeedPosts;
    }
  }

  showLoadingSpinner() {
    return this.loadingFirstBatchOfActiveTabPosts() || this.switchingTabs;
  }

  // controls whether we show the loading spinner
  loadingFirstBatchOfActiveTabPosts() {
    if (this.activeTab === FeedComponent.FOLLOWING_TAB) {
      return this.loadingFirstBatchOfFollowFeedPosts;
    } else {
      return this.loadingFirstBatchOfGlobalFeedPosts;
    }
  }

  showGlobalOrFollowingPosts() {
    return (
      this.postsToShow().length > 0 &&
      (this.activeTab === FeedComponent.GLOBAL_TAB || this.activeTab === FeedComponent.FOLLOWING_TAB)
    );
  }

  showNoPostsFound() {
    // activeTab == FeedComponent.GLOBAL_TAB && globalVars.postsToShow.length == 0 && !loadingPosts
    return (
      this.postsToShow().length === 0 &&
      (this.activeTab === FeedComponent.GLOBAL_TAB || this.activeTab === FeedComponent.FOLLOWING_TAB) &&
      !this.loadingFirstBatchOfActiveTabPosts()
    );
  }

  loadMorePosts() {
    if (this.activeTab === FeedComponent.FOLLOWING_TAB) {
      this._loadFollowFeedPosts();
    } else {
      this._loadPosts();
    }
  }

  showMoreButton() {
    if (this.loadingFirstBatchOfActiveTabPosts()) {
      return false;
    }

    if (this.activeTab === FeedComponent.FOLLOWING_TAB) {
      return this.serverHasMoreFollowFeedPosts;
    } else {
      return this.serverHasMoreGlobalFeedPosts;
    }
  }

  _onTabSwitch() {
    // Delay rendering the posts for a hot second so nav is fast.
    this.switchingTabs = true;
    setTimeout(() => {
      this.switchingTabs = false;
    }, 0);
  }

  _loadPosts(reload: boolean = false) {
    this.loadingMoreGlobalFeedPosts = true;

    // Get the reader's public key for the request.
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }

    // Get the last post hash in case this is a "load more" request.
    let lastPostHash = "";
    if (this.globalVars.postsToShow.length > 0 && !reload) {
      lastPostHash = this.globalVars.postsToShow[this.globalVars.postsToShow.length - 1].PostHashHex;
    }

    return this.backendApi
      .GetPostsStateless(
        this.globalVars.localNode,
        lastPostHash /*PostHash*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "", // Blank orderBy so we don't sort twice
        parseInt(this.globalVars.filterType) /*StartTstampSecs*/,
        "",
        FeedComponent.NUM_TO_FETCH /*NumToFetch*/,
        false /*FetchSubcomments*/,
        false /*GetPostsForFollowFeed*/,
        true /*GetPostsForGlobalWhitelist*/,
        false,
        0,
        this.globalVars.showAdminTools() /*AddGlobalFeedBool*/
      )
      .pipe(
        tap(
          (res) => {
            if (lastPostHash !== "") {
              res.PostsFound.shift();
              this.globalVars.postsToShow = this.globalVars.postsToShow.concat(res.PostsFound);
            } else {
              this.globalVars.postsToShow = res.PostsFound;
            }
            if (res.PostsFound.length < FeedComponent.NUM_TO_FETCH - 1) {
              // I'm not sure what the expected behavior is for the global feed. It may sometimes
              // return less than NUM_TO_FETCH while there are still posts available (e.g. if posts
              // are deleted. I'm not sure so just commenting out for now.
              // We'll move to infinite scroll soon, so not sure this is worth fixing rn.
              // this.serverHasMoreGlobalFeedPosts = true
            }
          },
          (err) => {
            console.error(err);
            this.globalVars._alertError("Error loading posts: " + this.backendApi.stringifyError(err));
          }
        ),
        finalize(() => {
          this.loadingFirstBatchOfGlobalFeedPosts = false;
          this.loadingMoreGlobalFeedPosts = false;
        }),
        first()
      )
      .toPromise();
  }

  _loadFollowing() {
    this.isLoadingFollowingOnPageLoad = true;

    this.backendApi
      .GetFollows(
        this.appData.localNode,
        "" /* username */,
        this.appData.loggedInUser.PublicKeyBase58Check,
        false /* getEntriesFollowingPublicKey */
      )
      .subscribe(
        (response) => {
          this.followedPublicKeyToProfileEntry = response.PublicKeyToProfileEntry;
        },
        (error) => {}
      )
      .add(() => {
        this._afterLoadingFollowingOnPageLoad();
      });
  }

  _loadFollowFeedPosts(reload: boolean = false) {
    this.loadingMoreFollowFeedPosts = true;

    // Get the reader's public key for the request.
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }

    // Get the last post hash in case this is a "load more" request.
    let lastPostHash = "";
    if (this.followFeedPosts.length > 0 && !reload) {
      lastPostHash = this.followFeedPosts[this.followFeedPosts.length - 1].PostHashHex;
    }

    return this.backendApi
      .GetPostsStateless(
        this.globalVars.localNode,
        lastPostHash /*PostHash*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "newest" /*OrderBy*/,
        parseInt(this.globalVars.filterType) /*StartTstampSecs*/,
        "",
        FeedComponent.NUM_TO_FETCH /*NumToFetch*/,
        false /*FetchSubcomments*/,
        true /*GetPostsForFollowFeed*/,
        false /*GetPostsForGlobalWhitelist*/,
        false,
        0,
        this.globalVars.showAdminTools() /*AddGlobalFeedBool*/
      )
      .pipe(
        tap(
          (res) => {
            if (lastPostHash !== "") {
              this.followFeedPosts = this.followFeedPosts.concat(res.PostsFound);
            } else {
              this.followFeedPosts = res.PostsFound;
            }
            if (res.PostsFound.length < FeedComponent.NUM_TO_FETCH) {
              this.serverHasMoreFollowFeedPosts = false;
              // Note: the server may be out of posts even if res.PostsFond == NUM_TO_FETCH.
              // This can happen if the server returns the last NUM_TO_FETCH posts exactly.
              // In that case, the user will click the load more button one more time, and then
              // the server will return 0. Obviously this isn't great behavior, but hopefully
              // we'll swap out the load more button for infinite scroll soon anyway.
            }
            this.loadingFirstBatchOfFollowFeedPosts = false;
            this.loadingMoreFollowFeedPosts = false;
          },
          (err) => {
            console.error(err);
            this.globalVars._alertError("Error loading posts: " + this.backendApi.stringifyError(err));
          }
        ),
        finalize(() => {
          this.loadingFirstBatchOfFollowFeedPosts = false;
          this.loadingMoreFollowFeedPosts = false;
        }),
        first()
      )
      .toPromise();
  }

  _afterLoadingFollowingOnPageLoad() {
    this.isLoadingFollowingOnPageLoad = false;

    // defaultActiveTab is "Following" if the user is following anybody. Otherwise
    // the default is global.
    let defaultActiveTab;
    const numFollowing = Object.keys(this.followedPublicKeyToProfileEntry).length;
    if (numFollowing >= FeedComponent.MIN_FOLLOWING_TO_SHOW_FOLLOW_FEED_BY_DEFAULT) {
      defaultActiveTab = FeedComponent.FOLLOWING_TAB;
    } else {
      defaultActiveTab = FeedComponent.GLOBAL_TAB;
    }

    this.feedTabs = [FeedComponent.GLOBAL_TAB, FeedComponent.FOLLOWING_TAB];

    if (!this.activeTab) {
      this.activeTab = defaultActiveTab;
    }
    this._handleTabClick(this.activeTab);
  }

  _handleTabClick(tab: string) {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { feedTab: this.activeTab },
      queryParamsHandling: "merge",
    });
    this._onTabSwitch();
  }

  static prependPostToFeed(postsToShow, postEntryResponse) {
    postsToShow.unshift(postEntryResponse);
  }

  // Note: the caller of this function may need to re-render the parentPost and grandparentPost,
  // since we update their CommentCounts
  static onPostHidden(postsToShow, postEntryResponse, parentPost, grandparentPost) {
    const postIndex = postsToShow.findIndex((post) => {
      return post.PostHashHex === postEntryResponse.PostHashHex;
    });

    if (postIndex === -1) {
      // TODO: rollbar
      console.error(`Problem finding postEntryResponse in postsToShow in onPostHidden`, {
        postEntryResponse,
        postsToShow,
      });
    }

    // the current post (1) + the CommentCount comments/subcomments were hidden
    const decrementAmount = 1 + postEntryResponse.CommentCount;

    if (parentPost != null) {
      parentPost.CommentCount -= decrementAmount;
    }

    if (grandparentPost != null) {
      grandparentPost.CommentCount -= decrementAmount;
    }

    postsToShow.splice(postIndex, 1);
  }

  static findParentPostIndex(postsToShow, postEntryResponse) {
    return postsToShow.findIndex((post) => {
      return post.PostHashHex === postEntryResponse.ParentStakeID;
    });
  }

  static appendCommentAfterParentPost(postsToShow, postEntryResponse) {
    const parentPostIndex = FeedComponent.findParentPostIndex(postsToShow, postEntryResponse);
    const parentPost = postsToShow[parentPostIndex];

    // Note: we don't worry about updating the grandparent posts' commentCount in the feed
    parentPost.CommentCount += 1;

    // This is a hack to make it so that the new comment shows up in the
    // feed with the "replying to @[parentPost.Username]" content displayed.
    postEntryResponse.parentPost = parentPost;

    // Insert the new comment in the correct place in the postsToShow list.
    // TODO: This doesn't work properly for comments on subcomments (they appear in the wrong
    // place in the list), but whatever, we can try to fix this edge case later
    postsToShow.splice(parentPostIndex + 1, 0, postEntryResponse);

    // Add the post to the parent's list of comments so that the comment count gets updated
    parentPost.Comments = parentPost.Comments || [];
    parentPost.Comments.unshift(postEntryResponse);
  }
}
