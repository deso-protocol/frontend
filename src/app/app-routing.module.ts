import { NgModule } from "@angular/core";
import { Routes, RouterModule, Router, Scroll } from "@angular/router";

import { ManageFollowsPageComponent } from "./manage-follows-page/manage-follows-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { BrowsePageComponent } from "./browse-page/browse-page.component";
import { CreatorsLeaderboardPageComponent } from "./creators-leaderboard/creators-leaderboard-page/creators-leaderboard-page.component";
import { BuyBitcloutPageComponent } from "./buy-bitclout-page/buy-bitclout-page.component";
import { MessagesPageComponent } from "./messages-page/messages-page.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";
import { CreatorProfilePageComponent } from "./creator-profile-page/creator-profile-page.component";
import { TradeCreatorPageComponent } from "./trade-creator-page/trade-creator-page.component";
import { UpdateProfilePageComponent } from "./update-profile-page/update-profile-page.component";
import { NotificationsPageComponent } from "./notifications-page/notifications-page.component";
import { PostThreadPageComponent } from "./post-thread-page/post-thread-page.component";
import { TransferBitcloutPageComponent } from "./transfer-bitclout-page/transfer-bitclout-page.component";
import { CreatePostPageComponent } from "./create-post-page/create-post-page.component";
import { TosPageComponent } from "./tos-page/tos-page.component";
import { AdminPageComponent } from "./admin-page/admin-page.component";
import { ViewportScroller } from "@angular/common";
import { filter } from "rxjs/operators";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { GetStarterBitcloutPageComponent } from "./get-starter-bitclout-page/get-starter-bitclout-page.component";
import { WalletComponent } from "./wallet/wallet.component";
import { SignUpComponent } from "./sign-up/sign-up.component";
import { PickACoinPageComponent } from "./pick-a-coin-page/pick-a-coin-page.component";
import { DiamondPostsComponent } from "./diamond-posts-page/diamond-posts/diamond-posts.component";
import { DiamondPostsPageComponent } from "./diamond-posts-page/diamond-posts-page.component";
import { TrendsPageComponent } from "./trends-page/trends-page.component";

class RouteNames {
  // Not sure if we should have a smarter schema for this, e.g. what happens if we have
  //   1. /:username/following
  //   2. /some/other/path/following
  // and we want to rename (1) but not (2) ?

  // /:username/following
  public static FOLLOWING = "following";

  // /:username/followers
  public static FOLLOWERS = "followers";

  public static BROWSE = "browse";
  public static CREATORS = "creators";
  public static BUY_BITCLOUT = "buy-bitclout";
  public static WALLET = "wallet";
  public static SETTINGS = "settings";
  public static USER_PREFIX = "u";
  public static INBOX_PREFIX = "inbox";
  public static TRANSFER_CREATOR = "transfer";
  public static PICK_A_COIN = "select-creator-coin";
  public static BUY_CREATOR = "buy";
  public static SELL_CREATOR = "sell";
  public static UPDATE_PROFILE = "update-profile";
  public static NOTIFICATIONS = "notifications";
  public static SIGN_UP = "sign-up";
  public static NOT_FOUND = "404";
  public static POSTS = "posts";
  public static SEND_BITCLOUT = "send-bitclout";
  // TODO: how do I make this /posts/new?
  public static CREATE_POST = "posts/new";
  public static TOS = "terms-of-service";
  public static ADMIN = "admin";
  public static GET_STARTER_BITCLOUT = "get-starter-bitclout";
  public static LANDING = "/";
  public static DIAMONDS = "diamonds";
  public static TRENDS = "trends";
}

const routes: Routes = [
  { path: "", component: LandingPageComponent, pathMatch: "full" },
  { path: RouteNames.BROWSE, component: BrowsePageComponent, pathMatch: "full" },
  { path: RouteNames.CREATORS, component: CreatorsLeaderboardPageComponent, pathMatch: "full" },
  { path: RouteNames.USER_PREFIX + "/:username", component: CreatorProfilePageComponent, pathMatch: "full" },
  { path: RouteNames.SETTINGS, component: SettingsPageComponent, pathMatch: "full" },
  { path: RouteNames.BUY_BITCLOUT, component: BuyBitcloutPageComponent, pathMatch: "full" },
  { path: RouteNames.PICK_A_COIN, component: PickACoinPageComponent, pathMatch: "full" },
  { path: RouteNames.INBOX_PREFIX, component: MessagesPageComponent, pathMatch: "full" },
  { path: RouteNames.SIGN_UP, component: SignUpComponent, pathMatch: "full" },
  { path: RouteNames.WALLET, component: WalletComponent, pathMatch: "full" },
  { path: RouteNames.UPDATE_PROFILE, component: UpdateProfilePageComponent, pathMatch: "full" },
  { path: RouteNames.NOTIFICATIONS, component: NotificationsPageComponent, pathMatch: "full" },
  { path: RouteNames.NOT_FOUND, component: NotFoundPageComponent, pathMatch: "full" },
  // CREATE_POST needs to be above the POSTS route, since both involve the prefix /posts
  // if CREATOR_POST is second, then it's route (/posts/new/) will get matched to POSTS instead
  { path: RouteNames.CREATE_POST, component: CreatePostPageComponent, pathMatch: "full" },
  { path: RouteNames.POSTS + "/:postHashHex", component: PostThreadPageComponent, pathMatch: "full" },
  { path: RouteNames.SEND_BITCLOUT, component: TransferBitcloutPageComponent, pathMatch: "full" },
  { path: RouteNames.TOS, component: TosPageComponent, pathMatch: "full" },
  { path: "tos", component: TosPageComponent, pathMatch: "full" },
  { path: RouteNames.ADMIN, component: AdminPageComponent, pathMatch: "full" },
  {
    path: RouteNames.USER_PREFIX + "/:username/" + RouteNames.FOLLOWERS,
    component: ManageFollowsPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.USER_PREFIX + "/:username/" + RouteNames.FOLLOWING,
    component: ManageFollowsPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.USER_PREFIX + "/:receiver/" + RouteNames.DIAMONDS + "/:sender",
    component: DiamondPostsPageComponent,
    pathMatch: "full",
  },
  { path: RouteNames.USER_PREFIX + "/:username/:tradeType", component: TradeCreatorPageComponent, pathMatch: "full" },
  { path: RouteNames.GET_STARTER_BITCLOUT, component: GetStarterBitcloutPageComponent, pathMatch: "full" },
  { path: RouteNames.TRENDS, component: TrendsPageComponent, pathMatch: "full" },
  // This NotFound route must be the last one as it catches all paths that were not matched above.
  { path: "**", component: NotFoundPageComponent, pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
class AppRoutingModule {
  // restore scroll position on navigation
  // we need the 100ms delay because it takes a hot sec to re-render the feed
  // angular doesn't handle scroll resuming correctly: https://github.com/angular/angular/issues/24547
  constructor(router: Router, viewportScroller: ViewportScroller) {
    router.events.pipe(filter((e): e is Scroll => e instanceof Scroll)).subscribe((e) => {
      if (e.position) {
        // backward navigation
        setTimeout(() => viewportScroller.scrollToPosition(e.position), 100);
      } else if (e.anchor) {
        // anchor navigation
        setTimeout(() => viewportScroller.scrollToAnchor(e.anchor), 100);
      } else {
        // forward navigation
        setTimeout(() => viewportScroller.scrollToPosition([0, 0]), 100);
      }
    });
  }

  static transferCreatorPath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username, RouteNames.TRANSFER_CREATOR].join("/");
  }

  static buyCreatorPath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username, RouteNames.BUY_CREATOR].join("/");
  }

  static sellCreatorPath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username, RouteNames.SELL_CREATOR].join("/");
  }

  static profilePath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username].join("/");
  }

  static userFollowingPath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username, RouteNames.FOLLOWING].join("/");
  }

  static userFollowersPath(username: string): string {
    return ["", RouteNames.USER_PREFIX, username, RouteNames.FOLLOWERS].join("/");
  }

  static postPath(postHashHex: string): string {
    return ["", RouteNames.POSTS, postHashHex].join("/");
  }
}

export { RouteNames, AppRoutingModule };
