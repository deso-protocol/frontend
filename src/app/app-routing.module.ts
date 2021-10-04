import { NgModule } from "@angular/core";
import { Routes, RouterModule, Router, Scroll } from "@angular/router";

import { ManageFollowsPageComponent } from "./manage-follows-page/manage-follows-page.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { BrowsePageComponent } from "./browse-page/browse-page.component";
import { CreatorsLeaderboardPageComponent } from "./creators-leaderboard/creators-leaderboard-page/creators-leaderboard-page.component";
import { BuyDeSoPageComponent } from "./buy-deso-page/buy-deso-page.component";
import { MessagesPageComponent } from "./messages-page/messages-page.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";
import { CreatorProfilePageComponent } from "./creator-profile-page/creator-profile-page.component";
import { TradeCreatorPageComponent } from "./trade-creator-page/trade-creator-page.component";
import { UpdateProfilePageComponent } from "./update-profile-page/update-profile-page.component";
import { NotificationsPageComponent } from "./notifications-page/notifications-page.component";
import { PostThreadPageComponent } from "./post-thread-page/post-thread-page.component";
import { TransferDeSoPageComponent } from "./transfer-deso-page/transfer-deso-page.component";
import { CreatePostPageComponent } from "./create-post-page/create-post-page.component";
import { TosPageComponent } from "./tos-page/tos-page.component";
import { AdminPageComponent } from "./admin-page/admin-page.component";
import { ViewportScroller } from "@angular/common";
import { filter } from "rxjs/operators";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { GetStarterDeSoPageComponent } from "./get-starter-deso-page/get-starter-deso-page.component";
import { SignUpComponent } from "./sign-up/sign-up.component";
import { PickACoinPageComponent } from "./pick-a-coin-page/pick-a-coin-page.component";
import { DiamondPostsPageComponent } from "./diamond-posts-page/diamond-posts-page.component";
import { TrendsPageComponent } from "./trends-page/trends-page.component";
import { NftPostPageComponent } from "./nft-post-page/nft-post-page.component";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";
import { ReferralsComponent } from "./referrals/referrals.component";
import { CreateProfileTutorialPageComponent } from "./tutorial/create-profile-tutorial-page/create-profile-tutorial-page.component";
import { BuyCreatorCoinsTutorialPageComponent } from "./tutorial/buy-creator-coins-tutorial-page/buy-creator-coins-tutorial-page.component";
import { BuyCreatorCoinsConfirmTutorialComponent } from "./tutorial/buy-creator-coins-tutorial-page/buy-creator-coins-confirm-tutorial/buy-creator-coins-confirm-tutorial.component";
import { WalletPageComponent } from "./wallet/wallet-page/wallet-page.component";
import { WalletTutorialPageComponent } from "./tutorial/wallet-tutorial-page/wallet-tutorial-page.component";
import { SellCreatorCoinsTutorialComponent } from "./tutorial/sell-creator-coins-tutorial-page/sell-creator-coins-tutorial/sell-creator-coins-tutorial.component";
import { DiamondTutorialPageComponent } from "./tutorial/diamond-tutorial-page/diamond-tutorial-page.component";
import { CreatePostTutorialPageComponent } from "./tutorial/create-post-tutorial-page/create-post-tutorial-page.component";
import { MintNftPageComponent } from "./mint-nft/mint-nft-page/mint-nft-page.component";
import { SellNftPageComponent } from "./sell-nft/sell-nft-page/sell-nft-page.component";
import { PlaceBidPageComponent } from "./place-bid/place-bid-page/place-bid-page.component";
import { RepostsPageComponent } from "./reposts-details/reposts-page/reposts-page.component";
import { LikesPageComponent } from "./likes-details/likes-page/likes-page.component";
import { DiamondsPageComponent } from "./diamonds-details/diamonds-page/diamonds-page.component";
import { QuoteRepostsPageComponent } from "./quote-reposts-details/quote-reposts-page/quote-reposts-page.component";

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
  public static BUY_DESO = "buy-deso";
  public static WALLET = "wallet";
  public static SETTINGS = "settings";
  public static USER_PREFIX = "u";
  public static INBOX_PREFIX = "inbox";
  public static TRANSFER_CREATOR = "transfer";
  public static PICK_A_COIN = "select-creator-coin";
  public static BUY_CREATOR = "buy";
  public static SELL_CREATOR = "sell";
  public static UPDATE_PROFILE = "update-profile";
  public static MINT_NFT = "mint-nft";
  public static SELL_NFT = "sell-nft";
  public static BID_NFT = "bid-nft";
  public static NOTIFICATIONS = "notifications";
  public static SIGN_UP = "sign-up";
  public static NOT_FOUND = "404";
  public static POSTS = "posts";
  public static SEND_DESO = "send-deso";
  // TODO: how do I make this /posts/new?
  public static CREATE_POST = "posts/new";
  public static TOS = "terms-of-service";
  public static ADMIN = "admin";
  public static GET_STARTER_DESO = "get-starter-deso";
  public static LANDING = "/";
  public static DIAMONDS = "diamonds";
  public static REPOSTS = "reposts";
  public static QUOTE_REPOSTS = "quote-reposts";
  public static LIKES = "likes";
  public static TRENDS = "trends";
  public static REFERRALS = "referrals";
  public static NFT = "nft";
  public static VERIFY_EMAIL = "verify-email";

  public static TUTORIAL = "tutorial";
  public static CREATE_PROFILE = "create-profile";
  public static INVEST = "invest";
}

const routes: Routes = [
  { path: "", component: LandingPageComponent, pathMatch: "full" },
  { path: RouteNames.BROWSE, component: BrowsePageComponent, pathMatch: "full" },
  { path: RouteNames.CREATORS, component: CreatorsLeaderboardPageComponent, pathMatch: "full" },
  { path: RouteNames.USER_PREFIX + "/:username", component: CreatorProfilePageComponent, pathMatch: "full" },
  { path: RouteNames.SETTINGS, component: SettingsPageComponent, pathMatch: "full" },
  { path: RouteNames.BUY_DESO, component: BuyDeSoPageComponent, pathMatch: "full" },
  { path: RouteNames.PICK_A_COIN, component: PickACoinPageComponent, pathMatch: "full" },
  { path: RouteNames.INBOX_PREFIX, component: MessagesPageComponent, pathMatch: "full" },
  { path: RouteNames.REFERRALS, component: ReferralsComponent, pathMatch: "full" },
  { path: RouteNames.SIGN_UP, component: SignUpComponent, pathMatch: "full" },
  { path: RouteNames.WALLET, component: WalletPageComponent, pathMatch: "full" },
  { path: RouteNames.UPDATE_PROFILE, component: UpdateProfilePageComponent, pathMatch: "full" },
  { path: RouteNames.MINT_NFT + "/:postHashHex", component: MintNftPageComponent, pathMatch: "full" },
  { path: RouteNames.SELL_NFT + "/:postHashHex", component: SellNftPageComponent, pathMatch: "full" },
  { path: RouteNames.BID_NFT + "/:postHashHex", component: PlaceBidPageComponent, pathMatch: "full" },
  { path: RouteNames.NOTIFICATIONS, component: NotificationsPageComponent, pathMatch: "full" },
  { path: RouteNames.NOT_FOUND, component: NotFoundPageComponent, pathMatch: "full" },
  // CREATE_POST needs to be above the POSTS route, since both involve the prefix /posts
  // if CREATOR_POST is second, then it's route (/posts/new/) will get matched to POSTS instead
  { path: RouteNames.CREATE_POST, component: CreatePostPageComponent, pathMatch: "full" },
  { path: RouteNames.POSTS + "/:postHashHex", component: PostThreadPageComponent, pathMatch: "full" },
  { path: RouteNames.POSTS + "/:postHashHex" + "/" + RouteNames.REPOSTS, component: RepostsPageComponent, pathMatch: "full" },
  {
    path: RouteNames.POSTS + "/:postHashHex" + "/" + RouteNames.QUOTE_REPOSTS,
    component: QuoteRepostsPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.POSTS + "/:postHashHex" + "/" + RouteNames.LIKES,
    component: LikesPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.POSTS + "/:postHashHex" + "/" + RouteNames.DIAMONDS,
    component: DiamondsPageComponent,
    pathMatch: "full",
  },
  { path: RouteNames.NFT + "/:postHashHex", component: NftPostPageComponent, pathMatch: "full" },
  { path: RouteNames.SEND_DESO, component: TransferDeSoPageComponent, pathMatch: "full" },
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
  { path: RouteNames.GET_STARTER_DESO, component: GetStarterDeSoPageComponent, pathMatch: "full" },
  { path: RouteNames.TRENDS, component: TrendsPageComponent, pathMatch: "full" },
  { path: RouteNames.VERIFY_EMAIL + "/:publicKey/:emailHash", component: VerifyEmailComponent, pathMatch: "full" },
  // TUTORIAL ROUTES
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.CREATE_PROFILE,
    component: CreateProfileTutorialPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.INVEST + "/" + RouteNames.BUY_CREATOR,
    component: BuyCreatorCoinsTutorialPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.INVEST + "/" + RouteNames.SELL_CREATOR + "/:username",
    component: SellCreatorCoinsTutorialComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.INVEST + "/" + RouteNames.BUY_CREATOR + "/:username",
    component: BuyCreatorCoinsConfirmTutorialComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.WALLET + "/:username",
    component: WalletTutorialPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.DIAMONDS,
    component: DiamondTutorialPageComponent,
    pathMatch: "full",
  },
  {
    path: RouteNames.TUTORIAL + "/" + RouteNames.CREATE_POST,
    component: CreatePostTutorialPageComponent,
    pathMatch: "full",
  },
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
