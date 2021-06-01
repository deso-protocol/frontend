import { Injectable } from "@angular/core";
import { PostEntryResponse, User } from "./backend-api.service";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { BackendApiService } from "./backend-api.service";
import { RouteNames } from "./app-routing.module";
import ConfettiGenerator from "confetti-js";
import { Observable, Observer } from "rxjs";
import { LoggedInUserObservableResult } from "../lib/observable-results/logged-in-user-observable-result";
import { FollowChangeObservableResult } from "../lib/observable-results/follow-change-observable-result";
import { SwalHelper } from "../lib/helpers/swal-helper";
import { environment } from "../environments/environment";
import { AmplitudeClient } from "amplitude-js";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { IdentityService } from "./identity.service";
import { configFromArray } from "ngx-bootstrap/chronos/create/from-array";
import { CommunityProject } from "../lib/services/bithunt/bithunt-service";
import { LeaderboardResponse } from "../lib/services/pulse/pulse-service";

@Injectable({
  providedIn: "root",
})
export class GlobalVarsService {
  // Note: I don't think we should have default values for this. I think we should just
  // loading spinner until we get a correct value. That said, I'm not going to fix that
  // right now, I'm just moving this magic number into a constant.
  static DEFAULT_NANOS_PER_USD_EXCHANGE_RATE = 1e9;

  constructor(
    private backendApi: BackendApiService,
    private sanitizer: DomSanitizer,
    private identityService: IdentityService,
    private router: Router
  ) {}

  static MAX_POST_LENGTH = 280;

  static FOUNDER_REWARD_BASIS_POINTS_WARNING_THRESHOLD = 50 * 100;

  static CREATOR_COIN_RESERVE_RATIO = 0.3333333;
  static CREATOR_COIN_TRADE_FEED_BASIS_POINTS = 1;

  // This is set to false immediately after our first attempt to get a loggedInUser.
  loadingInitialAppState = true;

  // We're waiting for the user to grant storage access (full-screen takeover)
  requestingStorageAccess = false;

  RouteNames = RouteNames;

  pausePolling = false; // TODO: Monkey patch for when polling conflicts with other calls.
  pauseMessageUpdates = false; // TODO: Monkey patch for when message polling conflicts with other calls.

  bitcloutToUSDExchangeRateToDisplay = "Fetching...";

  // We keep information regarding the messages tab in global vars for smooth
  // transitions to and from messages.
  messageNotificationCount = 0;
  messagesSortAlgorithm = "time";
  messagesPerFetch = 25;
  openSettingsTray = false;
  newMessagesFromPage = 0;
  messagesRequestsHoldersOnly = true;
  messagesRequestsHoldingsOnly = false;
  messagesRequestsFollowersOnly = false;
  messagesRequestsFollowedOnly = false;

  // Whether or not to show processig spinners in the UI for unmined transactions.
  showProcessingSpinners = false;

  rightBarLeaderboard = [];
  topCreatorsAllTimeLeaderboard: LeaderboardResponse[] = [];
  topGainerLeaderboard: LeaderboardResponse[] = [];
  topDiamondedLeaderboard: LeaderboardResponse[] = [];
  allCommunityProjectsLeaderboard: CommunityProject[] = [];
  topCommunityProjectsLeaderboard: CommunityProject[] = [];

  // We track logged-in state
  loggedInUser: User;
  userList: User[] = [];

  // map[pubkey]->bool of globomods
  globoMods: any;
  feeRateBitCloutPerKB = 0.0;
  postsToShow = [];
  messageResponse = null;
  messageMeta = {
    // <public_key || tstamp> -> messageObj
    decryptedMessgesMap: {},
    // <public_key> -> numMessagesRead
    notificationMap: {},
  };
  // Search and filter params
  filterType = "";
  // The coin balance and user profiles of the coins the the user
  // hodls and the users who hodl him.
  youHodlMap = {};
  hodlYouMap = {};

  // Map of diamond level to bitclout nanos.
  diamondLevelMap = {};

  // TODO(performance): We used to call the functions called by this function every
  // second. Now we call them only when needed, but the future is to get rid of this
  // and make everything use sockets.
  updateEverything: any;

  emailRegExp = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

  latestBitcoinAPIResponse: any;

  // Whether the left bar (hamburger) menu for mobile is currently open
  isLeftBarMobileOpen = false;

  loggedInUserObservable: Observable<LoggedInUserObservableResult>;
  loggedInUserObservers = [] as Observer<LoggedInUserObservableResult>[];

  followChangeObservable: Observable<FollowChangeObservableResult>;
  followChangeObservers = [] as Observer<FollowChangeObservableResult>[];

  nodeInfo: any;
  // The API node we connect to
  localNode: string = null;
  // Whether or not the node is running on the testnet or mainnet.
  isTestnet = false;

  // Whether or not to show the Verify phone number flow.
  showPhoneNumberVerification = false;

  // Whether or not to show the Buy BitClout with USD flow.
  showBuyWithUSD = false;

  // Whether or not this node comps profile creation.
  isCompProfileCreation = false;

  // Current fee to create a profile.
  createProfileFeeNanos: number;

  // Support email for this node (renders Help in the left bar nav)
  supportEmail: string = null;

  satoshisPerBitCloutExchangeRate: number;
  nanosPerUSDExchangeRate: number;
  // This is the USD to Bitcoin exchange rate according to external
  // sources.
  usdPerBitcoinExchangeRate: number;
  defaultFeeRateNanosPerKB: number;

  NanosSold: number;
  ProtocolUSDCentsPerBitcoinExchangeRate: number;

  nanosToBitCloutMemo = {};
  formatUSDMemo = {};

  confetti: any;
  canvasCount = 0;
  minSatoshisBurnedForProfileCreation: number;

  amplitude: AmplitudeClient;

  SetupMessages() {
    // If there's no loggedInUser, we set the notification count to zero
    if (!this.loggedInUser) {
      this.messageNotificationCount = 0;
      return;
    }

    // If a message response already exists, we skip this step
    if (this.messageResponse) {
      return;
    }

    let storedTab = this.backendApi.GetStorage("mostRecentMessagesTab");
    if (storedTab === null) {
      storedTab = "My Holders";
      this.backendApi.SetStorage("mostRecentMessagesTab", storedTab);
    }

    // Set the filters most recently used and load the messages
    this.SetMessagesFilter(storedTab);
    this.LoadInitialMessages();
  }

  SetMessagesFilter(tabName: any) {
    // Set the request parameters if it's a known tab.
    // Custom is set in the filter menu component and saved in local storage.
    if (tabName !== "Custom") {
      this.messagesRequestsHoldersOnly = tabName === "My Holders";
      this.messagesRequestsHoldingsOnly = false;
      this.messagesRequestsFollowersOnly = false;
      this.messagesRequestsFollowedOnly = false;
      this.messagesSortAlgorithm = "time";
    } else {
      this.messagesRequestsHoldersOnly = this.backendApi.GetStorage("customMessagesRequestsHoldersOnly");
      this.messagesRequestsHoldingsOnly = this.backendApi.GetStorage("customMessagesRequestsHoldingsOnly");
      this.messagesRequestsFollowersOnly = this.backendApi.GetStorage("customMessagesRequestsFollowersOnly");
      this.messagesRequestsFollowedOnly = this.backendApi.GetStorage("customMessagesRequestsFollowedOnly");
      this.messagesSortAlgorithm = this.backendApi.GetStorage("customMessagesSortAlgorithm");
    }
  }

  LoadInitialMessages() {
    if (!this.loggedInUser) {
      return;
    }

    this.backendApi
      .GetMessages(
        this.localNode,
        this.loggedInUser.PublicKeyBase58Check,
        "",
        this.messagesPerFetch,
        this.messagesRequestsHoldersOnly,
        this.messagesRequestsHoldingsOnly,
        this.messagesRequestsFollowersOnly,
        this.messagesRequestsFollowedOnly,
        this.messagesSortAlgorithm
      )
      .subscribe(
        (res) => {
          if (this.pauseMessageUpdates) {
            // We pause message updates when a user sends a messages so that we can
            // wait for it to be sent before updating the thread.  If we do not do this the
            // temporary message place holder would disappear until "GetMessages()" finds it.
          } else {
            this.messageResponse = res;

            // Update the number of new messages so we know when to stop scrolling
            this.newMessagesFromPage = res.OrderedContactsWithMessages.length;
          }
        },
        (err) => {
          console.error(this.backendApi.stringifyError(err));
        }
      );
  }

  _notifyLoggedInUserObservers(newLoggedInUser: User, isSameUserAsBefore: boolean) {
    this.loggedInUserObservers.forEach((observer) => {
      const result = new LoggedInUserObservableResult();
      result.loggedInUser = newLoggedInUser;
      result.isSameUserAsBefore = isSameUserAsBefore;
      observer.next(result);
    });
  }

  // NEVER change loggedInUser property directly. Use this method instead.
  setLoggedInUser(user: User) {
    const isSameUserAsBefore =
      this.loggedInUser && user && this.loggedInUser.PublicKeyBase58Check === user.PublicKeyBase58Check;

    this.loggedInUser = user;

    if (!isSameUserAsBefore) {
      // Store the user in localStorage
      this.backendApi.SetStorage(this.backendApi.LastLoggedInUserKey, user?.PublicKeyBase58Check);

      // Identify the user in amplitude
      this.amplitude?.setUserId(user?.PublicKeyBase58Check);

      // Clear out the message inbox and BitcoinAPI
      this.messageResponse = null;
      this.latestBitcoinAPIResponse = null;

      // Fix the youHodl / hodlYou maps.
      for (const entry of this.loggedInUser?.UsersYouHODL || []) {
        this.youHodlMap[entry.CreatorPublicKeyBase58Check] = entry;
      }
      for (const entry of this.loggedInUser?.UsersWhoHODLYou || []) {
        this.hodlYouMap[entry.HODLerPublicKeyBase58Check] = entry;
      }
    }

    this._notifyLoggedInUserObservers(user, isSameUserAsBefore);
  }

  hasUserBlockedCreator(publicKeyBase58Check): boolean {
    return this.loggedInUser?.BlockedPubKeys && publicKeyBase58Check in this.loggedInUser?.BlockedPubKeys;
  }

  showAdminTools(): boolean {
    return this.loggedInUser?.IsAdmin;
  }

  networkName(): string {
    return this.isTestnet ? "testnet" : "mainnet";
  }

  nanosToBitClout(nanos: number, maximumFractionDigits?: number): string {
    if (this.nanosToBitCloutMemo[nanos] && this.nanosToBitCloutMemo[nanos][maximumFractionDigits]) {
      return this.nanosToBitCloutMemo[nanos][maximumFractionDigits];
    }

    this.nanosToBitCloutMemo[nanos] = this.nanosToBitCloutMemo[nanos] || {};

    if (!maximumFractionDigits && nanos > 0) {
      // maximumFractionDigits defaults to 3.
      // Set it higher only if we have very small amounts.
      maximumFractionDigits = Math.floor(10 - Math.log10(nanos));
    }

    // Always show at least 2 digits
    if (maximumFractionDigits < 2) {
      maximumFractionDigits = 2;
    }

    // Never show more than 9 digits
    if (maximumFractionDigits > 9) {
      maximumFractionDigits = 9;
    }

    // Always show at least 2 digits
    const minimumFractionDigits = 2;
    const num = nanos / 1e9;
    this.nanosToBitCloutMemo[nanos][maximumFractionDigits] = Number(num).toLocaleString("en-US", {
      style: "decimal",
      currency: "USD",
      minimumFractionDigits,
      maximumFractionDigits,
    });
    return this.nanosToBitCloutMemo[nanos][maximumFractionDigits];
  }

  formatUSD(num: number, decimal: number): string {
    if (this.formatUSDMemo[num] && this.formatUSDMemo[num][decimal]) {
      return this.formatUSDMemo[num][decimal];
    }

    this.formatUSDMemo[num] = this.formatUSDMemo[num] || {};

    this.formatUSDMemo[num][decimal] = Number(num).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimal,
    });
    return this.formatUSDMemo[num][decimal];
  }

  /*
   * Converts long numbers to convenient abbreviations
   * Examples:
   *   value: 12345, decimals: 1 => 12.3K
   *   value: 3492311, decimals: 2 => 3.49M
   * */
  abbreviateNumber(value: number, decimals: number, formatUSD: boolean = false): string {
    let shortValue;
    const suffixes = ["", "K", "M", "B", "T"];
    const suffixNum = Math.floor((("" + value.toFixed(0)).length - 1) / 3);
    if (suffixNum === 0) {
      // if the number is less than 1000, we should only show at most 2 decimals places
      decimals = Math.min(2, decimals);
    }
    shortValue = (value / Math.pow(1000, suffixNum)).toFixed(decimals);
    if (formatUSD) {
      shortValue = this.formatUSD(shortValue, decimals);
    }
    return shortValue + suffixes[suffixNum];
  }

  nanosToUSDNumber(nanos: number): number {
    return nanos / this.nanosPerUSDExchangeRate;
  }

  nanosToUSD(nanos: number, decimal?: number): string {
    if (decimal == null) {
      decimal = 4;
    }
    return this.formatUSD(this.nanosToUSDNumber(nanos), decimal);
  }

  isMobile(): boolean {
    // from https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions
    const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

    return viewportWidth <= 992;
  }

  // Calculates the amount of bitclout one would receive if they sold an amount equal to creatorCoinAmountNano
  // given the current state of a creator's coin as defined by the coinEntry
  bitcloutNanosYouWouldGetIfYouSold(creatorCoinAmountNano: number, coinEntry: any): number {
    // These calculations are derived from the Bancor pricing formula, which
    // is proportional to a polynomial price curve (and equivalent to Uniswap
    // under certain assumptions). For more information, see the comment on
    // CreatorCoinSlope in constants.go and check out the Mathematica notebook
    // linked in that comment.
    //
    // This is the formula:
    // - B0 * (1 - (1 - dS / S0)^(1/RR))
    // - where:
    //     dS = bigDeltaCreatorCoin,
    //     B0 = bigCurrentBitCloutLocked
    //     S0 = bigCurrentCreatorCoinSupply
    //     RR = params.CreatorCoinReserveRatio
    const bitCloutLockedNanos = coinEntry.BitCloutLockedNanos;
    const currentCreatorCoinSupply = coinEntry.CoinsInCirculationNanos;
    // const deltaBitClout = creatorCoinAmountNano;
    const bitcloutBeforeFeesNanos =
      bitCloutLockedNanos *
      (1 -
        Math.pow(
          1 - creatorCoinAmountNano / currentCreatorCoinSupply,
          1 / GlobalVarsService.CREATOR_COIN_RESERVE_RATIO
        ));

    return (
      (bitcloutBeforeFeesNanos * (100 * 100 - GlobalVarsService.CREATOR_COIN_TRADE_FEED_BASIS_POINTS)) / (100 * 100)
    );
  }

  // Return a formatted version of the amount one would receive in USD if they sold creatorCoinAmountNano number of Creator Coins
  // given the current state of a creator's coin as defined by the coinEntry
  usdYouWouldGetIfYouSoldDisplay(creatorCoinAmountNano: number, coinEntry: any, abbreviate: boolean = true): string {
    if (creatorCoinAmountNano == 0) return "$0";
    const usdValue = this.nanosToUSDNumber(this.bitcloutNanosYouWouldGetIfYouSold(creatorCoinAmountNano, coinEntry));
    return abbreviate ? this.abbreviateNumber(usdValue, 2, true) : this.formatUSD(usdValue, 2);
  }

  creatorCoinNanosToUSDNaive(creatorCoinNanos, coinPriceBitCloutNanos, abbreviate: boolean = false): string {
    const usdValue = this.nanosToUSDNumber((creatorCoinNanos / 1e9) * coinPriceBitCloutNanos);
    return abbreviate ? this.abbreviateNumber(usdValue, 2, true) : this.formatUSD(usdValue, 2);
  }

  createProfileFeeInBitClout(): number {
    return this.createProfileFeeNanos / 1e9;
  }

  createProfileFeeInUsd(): string {
    return this.nanosToUSD(this.createProfileFeeNanos, 2);
  }

  convertTstampToDaysOrHours(tstampNanos: number) {
    // get total seconds between the times
    let delta = Math.abs(tstampNanos / 1000000 - new Date().getTime()) / 1000;

    // calculate (and subtract) whole days
    const days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    const hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    const minutes = Math.ceil(delta / 60) % 60;

    return `${days ? days + "d " : ""} ${!days && hours ? hours + "h" : ""} ${
      !days && !hours && minutes ? minutes + "m" : ""
    }`;
  }

  convertTstampToDateOrTime(tstampNanos: number) {
    const date = new Date(tstampNanos / 1e6);
    const currentDate = new Date();
    if (
      date.getDate() != currentDate.getDate() ||
      date.getMonth() != currentDate.getMonth() ||
      date.getFullYear() != currentDate.getFullYear()
    ) {
      return date.toLocaleString("default", { month: "short", day: "numeric" });
    }

    return date.toLocaleString("default", { hour: "numeric", minute: "numeric" });
  }

  doesLoggedInUserHaveProfile() {
    if (!this.loggedInUser) {
      return false;
    }

    const hasProfile =
      this.loggedInUser.ProfileEntryResponse && this.loggedInUser.ProfileEntryResponse.Username.length > 0;

    return hasProfile;
  }

  _copyText(val: string) {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
  }

  truncate(ss: string, len?: number): string {
    let ll = len;
    if (!ll) {
      ll = 18;
    }
    if (!ss || ss.length <= ll) {
      return ss;
    }
    return ss.slice(0, ll) + "...";
  }

  _parseFloat(val: any) {
    return parseFloat(val) ? parseFloat(val) : 0;
  }

  scrollTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }

  showLandingPage() {
    return this.userList && this.userList.length === 0;
  }

  _globopoll(passedFunc: any, expirationSecs?: any) {
    const startTime = new Date();
    const interval = setInterval(() => {
      if (passedFunc()) {
        clearInterval(interval);
      }
      if (expirationSecs && new Date().getTime() - startTime.getTime() > expirationSecs * 1000) {
        return true;
      }
    }, 1000);
  }

  _alertSuccess(val: any, altTitle?: string, funcAfter?: any) {
    let title = `Success!`;
    if (altTitle) {
      title = altTitle;
    }
    SwalHelper.fire({
      icon: "success",
      title,
      html: val,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
    }).then((res: any) => {
      if (funcAfter) {
        funcAfter();
      }
    });
  }

  _alertError(err: any, showBuyBitClout: boolean = false) {
    SwalHelper.fire({
      icon: "error",
      title: `Oops...`,
      html: err,
      showConfirmButton: true,
      showCancelButton: showBuyBitClout,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: showBuyBitClout ? "Buy BitClout" : "Ok",
      reverseButtons: true,
    }).then((res) => {
      if (showBuyBitClout && res.isConfirmed) {
        this.router.navigate([RouteNames.BUY_BITCLOUT], { queryParamsHandling: "merge" });
      }
    });
  }

  celebrate(dropDiamonds: boolean = false) {
    const canvasID = "my-canvas-" + this.canvasCount;
    this.canvasCount++;
    this.canvasCount = this.canvasCount % 5;
    const confettiSettings = {
      target: canvasID,
      max: 500,
      respawn: false,
      size: 2,
      start_from_edge: true,
      rotate: true,
      clock: 100,
    };
    if (dropDiamonds) {
      confettiSettings["props"] = [{ type: "svg", src: "/assets/img/diamond.svg", size: 10 }];
      confettiSettings.max = 200;
      confettiSettings.clock = 150;
    }
    this.confetti = new ConfettiGenerator(confettiSettings);
    this.confetti.render();
  }

  _setUpLoggedInUserObservable() {
    this.loggedInUserObservable = new Observable((observer) => {
      this.loggedInUserObservers.push(observer);
    });
  }

  _setUpFollowChangeObservable() {
    this.followChangeObservable = new Observable((observer) => {
      this.followChangeObservers.push(observer);
    });
  }

  // Does some basic checks on a public key.
  isMaybePublicKey(pk: string) {
    // Test net public keys start with 'tBC', regular public keys start with 'BC'.
    return pk.startsWith("tBC") || pk.startsWith("BC");
  }

  isVanillaReclout(post: PostEntryResponse): boolean {
    return !post.Body && !post.ImageURLs?.length && !!post.RecloutedPostEntryResponse;
  }

  getPostContentHashHex(post: PostEntryResponse): string {
    return this.isVanillaReclout(post) ? post.RecloutedPostEntryResponse.PostHashHex : post.PostHashHex;
  }

  incrementCommentCount(post: PostEntryResponse): PostEntryResponse {
    if (this.isVanillaReclout(post)) {
      post.RecloutedPostEntryResponse.CommentCount += 1;
    } else {
      post.CommentCount += 1;
    }
    return post;
  }

  // Log an event to amplitude
  //
  // Please follow the event format:
  //    singular object : present tense verb : extra context
  //
  // For example:
  //    bitpop : buy
  //    account : create : step1
  //    profile : update
  //    profile : update : error
  //
  // Use the data object to store extra event metadata. Don't use
  // the metadata to differentiate two events with the same name.
  // Instead, just create two (or more) events with better names.
  logEvent(event: string, data?: any) {
    if (!this.amplitude) {
      return;
    }

    this.amplitude.logEvent(event, data);
  }

  launchLoginFlow() {
    this.logEvent("account : login : launch");
    this.identityService.launch("/log-in").subscribe((res) => {
      this.logEvent("account : login : success");
      this.backendApi.setIdentityServiceUsers(res.users, res.publicKeyAdded);
      this.updateEverything().subscribe(() => {
        this.flowRedirect(res.signedUp);
      });
    });
  }

  launchSignupFlow() {
    this.logEvent("account : create : launch");
    this.identityService.launch("/log-in").subscribe((res) => {
      this.logEvent("account : create : success");
      this.backendApi.setIdentityServiceUsers(res.users, res.publicKeyAdded);
      this.updateEverything().subscribe(() => {
        this.flowRedirect(res.signedUp);
      });
    });
  }

  flowRedirect(signedUp: boolean): void {
    if (signedUp) {
      // If this node supports phone number verification, go to step 3, else proceed to step 4.
      const stepNum = this.showPhoneNumberVerification ? 3 : 4;
      this.router.navigate(["/" + this.RouteNames.SIGN_UP], {
        queryParams: { stepNum },
      });
    } else {
      this.router.navigate(["/" + this.RouteNames.BROWSE]);
    }
  }

  Init(loggedInUser: User, userList: User[], route: ActivatedRoute) {
    this._setUpLoggedInUserObservable();
    this._setUpFollowChangeObservable();

    this.userList = userList;
    this.satoshisPerBitCloutExchangeRate = 0;
    this.nanosPerUSDExchangeRate = GlobalVarsService.DEFAULT_NANOS_PER_USD_EXCHANGE_RATE;
    this.usdPerBitcoinExchangeRate = 10000;
    this.defaultFeeRateNanosPerKB = 0.0;

    this.localNode = this.backendApi.GetStorage(this.backendApi.LastLocalNodeKey);

    if (!this.localNode) {
      const hostname = (window as any).location.hostname;
      if (environment.production) {
        this.localNode = hostname;
      } else {
        this.localNode = `${hostname}:17001`;
      }

      this.backendApi.SetStorage(this.backendApi.LastLocalNodeKey, this.localNode);
    }

    let identityServiceURL = this.backendApi.GetStorage(this.backendApi.LastIdentityServiceKey);
    if (!identityServiceURL) {
      identityServiceURL = "https://identity.bitclout.com";
      this.backendApi.SetStorage(this.backendApi.LastIdentityServiceKey, identityServiceURL);
    }
    this.identityService.identityServiceURL = identityServiceURL;
    this.identityService.sanitizedIdentityServiceURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      `${identityServiceURL}/embed?v=2`
    );

    this._globopoll(() => {
      if (!this.defaultFeeRateNanosPerKB) {
        return false;
      }
      this.feeRateBitCloutPerKB = this.defaultFeeRateNanosPerKB / 1e9;
      return true;
    });
  }
}
