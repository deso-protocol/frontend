import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { TextFieldModule } from "@angular/cdk/text-field";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BackendApiService } from "./backend-api.service";
import { GlobalVarsService } from "./global-vars.service";
import { IdentityService } from "./identity.service";
import { TermsOfServiceComponent } from "./terms-of-service/terms-of-service.component";
import { ManageFollowsComponent } from "./manage-follows-page/manage-follows/manage-follows.component";
import { ManageFollowsPageComponent } from "./manage-follows-page/manage-follows-page.component";
import { FollowButtonComponent } from "./follow-button/follow-button.component";
import { NotFoundPageComponent } from "./not-found-page/not-found-page.component";
import { BrowsePageComponent } from "./browse-page/browse-page.component";
import { FeedComponent } from "./feed/feed.component";
import { LeftBarComponent } from "./left-bar/left-bar.component";
import { RightBarCreatorsComponent } from "./right-bar-creators/right-bar-creators.component";
import { FeedCreatePostComponent } from "./feed/feed-create-post/feed-create-post.component";
import { FeedPostComponent } from "./feed/feed-post/feed-post.component";
import { FeedPostDropdownComponent } from "./feed/feed-post-dropdown/feed-post-dropdown.component";
import { FeedPostIconRowComponent } from "./feed/feed-post-icon-row/feed-post-icon-row.component";
import { CreatorsLeaderboardPageComponent } from "./creators-leaderboard/creators-leaderboard-page/creators-leaderboard-page.component";
import { CreatorsLeaderboardComponent } from "./creators-leaderboard/creators-leaderboard/creators-leaderboard.component";
import { BuyBitcloutPageComponent } from "./buy-bitclout-page/buy-bitclout-page.component";
import { MessagesPageComponent } from "./messages-page/messages-page.component";
import { SettingsPageComponent } from "./settings-page/settings-page.component";
import { CreatorProfilePageComponent } from "./creator-profile-page/creator-profile-page.component";
import { CreatorProfileDetailsComponent } from "./creator-profile-page/creator-profile-details/creator-profile-details.component";
import { CreatorProfileHodlersComponent } from "./creator-profile-page/creator-profile-hodlers/creator-profile-hodlers.component";
import { CreatorProfilePostsComponent } from "./creator-profile-page/creator-profile-posts/creator-profile-posts.component";
import { TabSelectorComponent } from "./tab-selector/tab-selector.component";
import { CreatorProfileTopCardComponent } from "./creator-profile-page/creator-profile-top-card/creator-profile-top-card.component";
import { LeftBarButtonComponent } from "./left-bar/left-bar-button/left-bar-button.component";
import { TradeCreatorPageComponent } from "./trade-creator-page/trade-creator-page.component";
import { TradeCreatorComponent } from "./trade-creator-page/trade-creator/trade-creator.component";
import { BuyBitcloutComponent } from "./buy-bitclout-page/buy-bitclout/buy-bitclout.component";
import { BuyBitcloutUSDComponent } from "./buy-bitclout-page/buy-bitclout-usd/buy-bitclout-usd.component";
import { TradeCreatorFormComponent } from "./trade-creator-page/trade-creator-form/trade-creator-form.component";
import { TradeCreatorPreviewComponent } from "./trade-creator-page/trade-creator-preview/trade-creator-preview.component";
import { TradeCreatorCompleteComponent } from "./trade-creator-page/trade-creator-complete/trade-creator-complete.component";
import { UpdateProfilePageComponent } from "./update-profile-page/update-profile-page.component";
import { NotificationsPageComponent } from "./notifications-page/notifications-page.component";
import { SearchBarComponent } from "./search-bar/search-bar.component";
import { SimpleCenterLoaderComponent } from "./simple-center-loader/simple-center-loader.component";
import { ChangeAccountSelectorComponent } from "./change-account-selector/change-account-selector.component";
import { RightBarSignupComponent } from "./right-bar-signup/right-bar-signup.component";
import { TradeCreatorTableComponent } from "./trade-creator-page/trade-creator-table/trade-creator-table.component";
import { PostThreadPageComponent } from "./post-thread-page/post-thread-page.component";
import { PostThreadComponent } from "./post-thread-page/post-thread/post-thread.component";
import { UpdateProfileComponent } from "./update-profile-page/update-profile/update-profile.component";
import { RightBarCreatorsLeaderboardComponent } from "./right-bar-creators/right-bar-creators-leaderboard/right-bar-creators-leaderboard.component";
import { BottomBarMobileComponent } from "./bottom-bar-mobile/bottom-bar-mobile.component";
import { LeftBarMobileComponent } from "./left-bar-mobile/left-bar-mobile.component";
import { TransferBitcloutPageComponent } from "./transfer-bitclout-page/transfer-bitclout-page.component";
import { TransferBitcloutComponent } from "./transfer-bitclout/transfer-bitclout.component";
import { BuyBitcloutLoggedOutComponent } from "./buy-bitclout-page/buy-bitclout-logged-out/buy-bitclout-logged-out.component";
import { BuyBitcloutCompleteComponent } from "./buy-bitclout-page/buy-bitclout-complete/buy-bitclout-complete.component";
import { MessagesInboxComponent } from "./messages-page/messages-inbox/messages-inbox.component";
import { MessagesThreadComponent } from "./messages-page/messages-thread/messages-thread.component";
import { MessageComponent } from "./messages-page/message/message.component";
import { MessagesThreadViewComponent } from "./messages-page/messages-thread-view/messages-thread-view.component";
import { TopBarMobileNavigationControlComponent } from "./top-bar-mobile/top-bar-mobile-navigation-control/top-bar-mobile-navigation-control.component";
import { BottomBarMobileTabComponent } from "./bottom-bar-mobile/bottom-bar-mobile-tab/bottom-bar-mobile-tab.component";
import { NotFoundComponent } from "./not-found-page/not-found/not-found.component";
import { CreatePostPageComponent } from "./create-post-page/create-post-page.component";
import { CreatePostFormComponent } from "./create-post-page/create-post-form/create-post-form.component";
import { TopBarMobileLogInOrSignUpComponent } from "./top-bar-mobile/top-bar-mobile-log-in-or-sign-up/top-bar-mobile-log-in-or-sign-up.component";
import { TopBarMobileHamburgerMenuComponent } from "./top-bar-mobile/top-bar-mobile-hamburger-menu/top-bar-mobile-hamburger-menu.component";
import { TradeCreatorLoggedOutComponent } from "./trade-creator-page/trade-creator-logged-out/trade-creator-logged-out.component";
import { TosPageComponent } from "./tos-page/tos-page.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AdminPageComponent } from "./admin-page/admin-page.component";
import { AdminComponent } from "./admin/admin.component";
import { AdminWyreComponent } from "./admin/admin-wyre/admin-wyre.component";
import { NetworkInfoComponent } from "./network-info/network-info.component";
import { SanitizeAndAutoLinkPipe } from "../lib/pipes/sanitize-and-auto-link-pipe";
import { SanitizeEmbedPipe } from "../lib/pipes/sanitize-embed-pipe";
import { NgxIntlTelInputModule } from "ngx-intl-tel-input";
import { SettingsComponent } from "./settings/settings.component";
import { NotificationsListComponent } from "./notifications-page/notifications-list/notifications-list.component";
import { UiScrollModule } from "ngx-ui-scroll";
import { PageComponent } from "./page/page.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { PopoverModule } from "ngx-bootstrap/popover";
import { RatingModule } from "ngx-bootstrap/rating";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { LandingPageComponent } from "./landing-page/landing-page.component";
import { AnimateOnScrollModule } from "ng2-animate-on-scroll";
import { SignUpGetStarterBitcloutComponent } from "./sign-up/sign-up-get-starter-bitclout/sign-up-get-starter-bitclout.component";
import { UpdateProfileGetStarterBitcloutComponent } from "./update-profile-page/update-profile-get-starter-bitclout/update-profile-get-starter-bitclout.component";
import { GetStarterBitcloutPageComponent } from "./get-starter-bitclout-page/get-starter-bitclout-page.component";
import { GetStarterBitcloutComponent } from "./get-starter-bitclout-page/get-starter-bitclout/get-starter-bitclout.component";
import { CommentModalComponent } from "./comment-modal/comment-modal.component";
import { WalletComponent } from "./wallet/wallet.component";
import { Toast, ToastrModule } from "ngx-toastr";
import { SignUpComponent } from "./sign-up/sign-up.component";
import { WalletActionsDropdownComponent } from "./wallet/wallet-actions-dropdown/wallet-actions-dropdown.component";
import { PickACoinPageComponent } from "./pick-a-coin-page/pick-a-coin-page.component";
import { DiamondsModalComponent } from "./diamonds-modal/diamonds-modal.component";
import { RecloutsModalComponent } from "./reclouts-modal/reclouts-modal.component";
import { QuoteRecloutsModalComponent } from "./quote-reclouts-modal/quote-reclouts-modal.component";
import { LikesModalComponent } from "./likes-modal/likes-modal.component";
import { SimpleProfileCardComponent } from "./simple-profile-card/simple-profile-card.component";
import { CreatorDiamondsComponent } from "./creator-profile-page/creator-diamonds/creator-diamonds.component";
import { DiamondPostsPageComponent } from "./diamond-posts-page/diamond-posts-page.component";
import { DiamondPostsComponent } from "./diamond-posts-page/diamond-posts/diamond-posts.component";
import { MessagesFilterMenuComponent } from "./messages-page/messages-inbox/messages-filter-menu/messages-filter-menu.component";
import { CountdownTimerComponent } from "./countdown-timer/countdown-timer.component";
import { AvatarDirective } from "./avatar/avatar.directive";
import { TrendsPageComponent } from "./trends-page/trends-page.component";
import { TrendsComponent } from "./trends-page/trends/trends.component";
import { UploadDirective } from "./directives/upload.directive";
import { SanitizeQRCodePipe } from "../lib/pipes/sanitize-qrcode-pipe";

// Modular Themes for BitClout by Carsen Klock @carsenk
import { ThemeModule } from "./theme/theme.module";
import { lightTheme } from "./theme/light-theme";
import { darkTheme } from "./theme/dark-theme";
import { icydarkTheme } from "./theme/icy-dark-theme";
import { legendsTheme } from "./theme/legends-theme";

@NgModule({
  declarations: [
    AppComponent,
    UploadDirective,
    TermsOfServiceComponent,
    ManageFollowsComponent,
    ManageFollowsPageComponent,
    FollowButtonComponent,
    NotFoundPageComponent,
    BrowsePageComponent,
    FeedComponent,
    LeftBarComponent,
    RightBarCreatorsComponent,
    FeedCreatePostComponent,
    FeedPostComponent,
    FeedPostDropdownComponent,
    FeedPostIconRowComponent,
    CreatorsLeaderboardPageComponent,
    CreatorsLeaderboardComponent,
    BuyBitcloutPageComponent,
    WalletComponent,
    MessagesPageComponent,
    SettingsPageComponent,
    CreatorProfilePageComponent,
    CreatorProfileDetailsComponent,
    CreatorProfileHodlersComponent,
    CreatorProfilePostsComponent,
    TabSelectorComponent,
    CreatorProfileTopCardComponent,
    LeftBarButtonComponent,
    TradeCreatorPageComponent,
    TradeCreatorComponent,
    BuyBitcloutComponent,
    BuyBitcloutUSDComponent,
    TradeCreatorFormComponent,
    TradeCreatorPreviewComponent,
    TradeCreatorCompleteComponent,
    UpdateProfilePageComponent,
    NotificationsPageComponent,
    SearchBarComponent,
    SimpleCenterLoaderComponent,
    ChangeAccountSelectorComponent,
    RightBarSignupComponent,
    TradeCreatorTableComponent,
    PostThreadPageComponent,
    PostThreadComponent,
    UpdateProfileComponent,
    RightBarCreatorsLeaderboardComponent,
    BottomBarMobileComponent,
    LeftBarMobileComponent,
    TransferBitcloutPageComponent,
    TransferBitcloutComponent,
    BuyBitcloutLoggedOutComponent,
    BuyBitcloutCompleteComponent,
    MessagesInboxComponent,
    MessagesThreadComponent,
    MessageComponent,
    MessagesThreadViewComponent,
    TopBarMobileNavigationControlComponent,
    BottomBarMobileTabComponent,
    NotFoundComponent,
    CreatePostPageComponent,
    CreatePostFormComponent,
    TopBarMobileLogInOrSignUpComponent,
    TopBarMobileHamburgerMenuComponent,
    TradeCreatorLoggedOutComponent,
    TosPageComponent,
    AdminPageComponent,
    AdminComponent,
    AdminWyreComponent,
    NetworkInfoComponent,
    SanitizeAndAutoLinkPipe,
    SanitizeEmbedPipe,
    SettingsComponent,
    NotificationsListComponent,
    PageComponent,
    LandingPageComponent,
    SignUpComponent,
    SignUpGetStarterBitcloutComponent,
    UpdateProfileGetStarterBitcloutComponent,
    GetStarterBitcloutPageComponent,
    GetStarterBitcloutComponent,
    CommentModalComponent,
    WalletActionsDropdownComponent,
    PickACoinPageComponent,
    CreatorDiamondsComponent,
    DiamondsModalComponent,
    RecloutsModalComponent,
    QuoteRecloutsModalComponent,
    LikesModalComponent,
    SimpleProfileCardComponent,
    MessagesFilterMenuComponent,
    DiamondPostsPageComponent,
    DiamondPostsComponent,
    CountdownTimerComponent,
    AvatarDirective,
    TrendsPageComponent,
    TrendsComponent,
    SanitizeQRCodePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    TextFieldModule,
    NgxIntlTelInputModule,
    UiScrollModule,
    AnimateOnScrollModule.forRoot(),
    ToastrModule.forRoot(),
    BsDropdownModule.forRoot(),
    PopoverModule.forRoot(),
    RatingModule.forRoot(),
    CollapseModule.forRoot(),
    ThemeModule.forRoot({
      themes: [lightTheme, darkTheme, icydarkTheme, legendsTheme],
      active:
        localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
    }),
  ],
  providers: [BackendApiService, GlobalVarsService, BsModalService, IdentityService],
  bootstrap: [AppComponent],
})
export class AppModule {}
