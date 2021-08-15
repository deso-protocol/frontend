import { Component, OnInit, Input } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../backend-api.service";
import { sprintf } from "sprintf-js";
import { SwalHelper } from "../../lib/helpers/swal-helper";
import * as _ from "lodash";
import { Title } from "@angular/platform-browser";

class Messages {
  static INCORRECT_PASSWORD = `The password you entered was incorrect.`;
  static CONNECTION_PROBLEM = `There is currently a connection problem. Is your connection to your node healthy?`;
  static INSUFFICIENT_BALANCE = `You don't have enough BitClout to process the transaction. Try reducing the fee rate.`;
  static SEND_BITCLOUT_MIN = `You must send a non-zero amount of BitClout`;
  static INVALID_PUBLIC_KEY = `The public key you entered is invalid`;
}

// TODO: Cleanup - separate this into multiple components
@Component({
  selector: "admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
})
export class AdminComponent implements OnInit {
  globalVars: GlobalVarsService;
  adminPosts = [];
  adminPostsByClout = [];
  activePosts = [];
  activeTab: string;
  activePostTab: string;
  loadingPosts = false;
  loadingMorePosts = false;
  loadingMempoolStats = true;
  loadingGlobalParams = true;
  loadingPostsByClout = false;
  searchingForPostsByClout = false;
  @Input() isMobile = false;

  blacklistPubKeyOrUsername = "";
  graylistPubKeyOrUsername = "";
  unrestrictPubKeyOrUsername = "";
  whitelistPubKeyOrUsername = "";
  unwhitelistPubKeyOrUsername = "";
  removePhonePubKeyorUsername = "";

  updateProfileSuccessType = "";
  whitelistUpdateSuccess = false;
  unwhitelistUpdateSuccess = false;

  clearSuccessTimeout: any;
  whitelistSuccessTimeout: any;
  unwhitelistSuccessTimeout: any;

  submittingProfileUpdateType = "";
  submittingBlacklistUpdate = false;
  submittingGraylistUpdate = false;
  submittingUnrestrictUpdate = false;
  submittingWhitelistUpdate = false;
  submittingUnwhitelistUpdate = false;
  submittingEvictUnminedBitcoinTxns = false;
  submittingUSDToBitCloutReserveExchangeRateUpdate = false;
  submittingBuyBitCloutFeeRate = false;

  submittingRemovePhone = false;
  dbDetailsOpen = false;
  dbDetailsLoading = false;
  userMetadataMap = {};
  usernameMap = {};
  userMetadataMapLength = 0;
  mempoolSummaryStats: any = {};
  mempoolTxnCount = 0;
  bitcoinExchangeRate: number;
  usdToBitCloutReserveExchangeRate: number;
  buyBitCloutFeeRate: number;
  updatingBitcoinExchangeRate = false;
  updatingGlobalParams = false;
  updatingUSDToBitcoin = false;
  updatingCreateProfileFee = false;
  updatingMinimumNetworkFee = false;
  updatingMaxCopiesPerNFT = false;
  updatingCreateNFTFeeNanos = false;
  feeRateBitCloutPerKB = (1000 / 1e9).toFixed(9); // Default fee rate.
  bitcoinBlockHashOrHeight = "";
  evictBitcoinTxnHashes = "";
  usernameToVerify = "";
  usernameForWhomToRemoveVerification = "";
  usernameToFetchVerificationAuditLogs = "";
  removingNilPosts = false;
  submittingReprocessRequest = false;
  submittingRemovalRequest = false;
  submittingVerifyRequest = false;
  mempoolTotalBytes = 0;
  loadingNextBlockStats = false;
  nextBlockStats: any = {};
  globalParams: any = {};
  updateGlobalParamsValues = {
    USDPerBitcoin: 0,
    CreateProfileFeeNanos: 0,
    MinimumNetworkFeeNanosPerKB: 0,
    MaxCopiesPerNFT: 0,
    CreateNFTFeeNanos: 0,
  };
  verifiedUsers: any = [];
  usernameVerificationAuditLogs: any = [];
  loadingVerifiedUsers = false;
  loadingVerifiedUsersAuditLog = false;
  adminTabs = ["Posts", "Profiles", "NFTs", "Tutorial", "Network", "Mempool", "Wyre", "Jumio"];

  POSTS_TAB = "Posts";
  POSTS_BY_CLOUT_TAB = "Posts By Clout";
  adminPostTabs = [this.POSTS_TAB, this.POSTS_BY_CLOUT_TAB];

  // Fields for SwapIdentity
  submittingSwapIdentity = false;
  swapIdentityFromUsernameOrPublicKey = "";
  swapIdentityToUsernameOrPublicKey = "";

  // Fields for UpdateUsername
  submittingUpdateUsername = false;
  changeUsernamePublicKey = "";
  usernameTarget = "";
  userMetadataToUpdate = null;
  userProfileEntryResponseToUpdate: ProfileEntryResponse = null;
  searchedForPubKey = false;

  // These are the options used to populate the dropdown for selecting a time window over which we want to fetch
  // posts ordered by clout.
  timeWindowOptions = {
    "15m": 15,
    "30m": 30,
    "60m": 60,
  };
  // This is a variable to track the currently selected time window.
  selectedTimeWindow = 60;

  // Fields for getting user admin data
  submittingGetUserAdminData = false;
  getUserAdminDataPublicKey = "";
  getUserAdminDataResponse = null;

  constructor(
    private _globalVars: GlobalVarsService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService,
    private titleService: Title
  ) {
    this.globalVars = _globalVars;
  }

  ngOnInit() {
    if (this.globalVars.showSuperAdminTools()) {
      this.adminTabs.push("Super");
    }

    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.adminTab) {
        this.activeTab = queryParams.adminTab;
      } else {
        this.activeTab = "Posts";
      }
    });
    // load data
    this._updateNodeInfo();

    // Get some posts to show the user.
    this.loadingPosts = true;
    this.activePostTab = this.POSTS_TAB;
    this._loadPosts();
    this._loadPostsByClout();

    // Get the latest mempool stats.
    this._loadMempoolStats();
    this._loadNextBlockStats();
    this._loadGlobalParams();

    // Get current fee percentage and reserve USD to BitClout exchange price.
    this._loadBuyBitCloutFeeRate();
    this._loadUSDToBitCloutReserveExchangeRate();

    this.titleService.setTitle("Admin - BitClout");
  }

  _updateNodeInfo() {
    if (!this.globalVars.loggedInUser) {
      return;
    }
    this.backendApi
      .NodeControl(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, "", "get_info")
      .subscribe(
        (res: any) => {
          if (res == null || res.BitCloutStatus == null) {
            return;
          }

          this.globalVars.nodeInfo = res;
        },
        (error) => {
          console.error(error);
          this.globalVars.nodeInfo = null;
        }
      );
  }

  _tabClicked(tabName: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { adminTab: this.activeTab },
      queryParamsHandling: "merge",
    });
  }

  _postTabClicked(postTabName: string) {
    this.activePostTab = postTabName;
    if (postTabName === this.POSTS_BY_CLOUT_TAB) {
      this.activePosts = this.adminPostsByClout;
    } else {
      this.activePosts = this.adminPosts;
    }
  }

  _searchPostsByClout() {
    this.searchingForPostsByClout = true;
    this._loadPostsByClout();
  }

  _loadPostsByClout() {
    this.loadingPostsByClout = true;
    // Get the reader's public key for the request.
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }

    if (!this.selectedTimeWindow) {
      this.selectedTimeWindow = 60;
    }
    this.backendApi
      .GetPostsStateless(
        this.globalVars.localNode,
        "" /*PostHash*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "" /*OrderBy*/,
        parseInt(this.globalVars.filterType) /*StartTstampSecs*/,
        "",
        50 /*NumToFetch*/,
        false /*FetchSubcomments*/,
        false /*GetPostsForFollowFeed*/,
        false /*GetPostsForGlobalWhitelist*/,
        true,
        false /*MediaRequired*/,
        this.selectedTimeWindow,
        true /*AddGlobalFeedBool*/
      )
      .subscribe(
        (res) => {
          this.adminPostsByClout = res.PostsFound;
          if (this.activePostTab === this.POSTS_BY_CLOUT_TAB) {
            this.activePosts = this.adminPostsByClout;
          }
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError("Error loading posts: " + this.backendApi.stringifyError(err));
        }
      )
      .add(() => {
        this.loadingPostsByClout = false;
        this.searchingForPostsByClout = false;
      });
  }

  _loadPosts() {
    this.loadingMorePosts = true;

    // Get the reader's public key for the request.
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }

    // Get the last post hash in case this is a "load more" request.
    let lastPostHash = "";
    if (this.adminPosts.length > 0) {
      lastPostHash = this.adminPosts[this.adminPosts.length - 1].PostHashHex;
    }
    this.backendApi
      .GetPostsStateless(
        this.globalVars.localNode,
        lastPostHash /*PostHash*/,
        readerPubKey /*ReaderPublicKeyBase58Check*/,
        "newest" /*OrderBy*/,
        parseInt(this.globalVars.filterType) /*StartTstampSecs*/,
        "",
        50 /*NumToFetch*/,
        false /*FetchSubcomments*/,
        false /*GetPostsForFollowFeed*/,
        false /*GetPostsForGlobalWhitelist*/,
        false,
        false /*MediaRequired*/,
        0,
        true /*AddGlobalFeedBool*/
      )
      .subscribe(
        (res) => {
          if (lastPostHash != "") {
            this.adminPosts = this.adminPosts.concat(res.PostsFound);
          } else {
            this.adminPosts = res.PostsFound;
          }
          if (this.activePostTab === this.POSTS_TAB) {
            this.activePosts = this.adminPosts;
          }
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError("Error loading posts: " + this.backendApi.stringifyError(err));
        }
      )
      .add(() => {
        this.loadingMorePosts = false;
        this.loadingPosts = false;
      });
  }

  _loadMempoolStats() {
    console.log("Loading mempool stats...");
    this.loadingMempoolStats = true;
    this.backendApi
      .AdminGetMempoolStats(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe(
        (res) => {
          this.mempoolSummaryStats = res.TransactionSummaryStats;
          this.mempoolTxnCount = _.sumBy(Object.values(this.mempoolSummaryStats), (o) => {
            return o["Count"];
          });
          this.mempoolTotalBytes = _.sumBy(Object.values(this.mempoolSummaryStats), (o) => {
            return o["TotalBytes"];
          });
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loadingMempoolStats = true;
      });
  }

  _loadVerifiedUsers() {
    this.loadingVerifiedUsers = true;
    console.log("Loading verified users...");
    this.backendApi
      .AdminGetVerifiedUsers(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe(
        (res) => {
          this.verifiedUsers = res.VerifiedUsers;
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loadingVerifiedUsers = false;
      });
  }

  _loadVerifiedUsersAuditLog() {
    this.loadingVerifiedUsersAuditLog = true;
    console.log("Loading username verification audit log...");
    this.backendApi
      .AdminGetUsernameVerificationAuditLogs(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.usernameToFetchVerificationAuditLogs
      )
      .subscribe(
        (res) => {
          this.usernameVerificationAuditLogs = res.VerificationAuditLogs;
          console.log(this.usernameVerificationAuditLogs);
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loadingVerifiedUsersAuditLog = false;
      });
  }

  _loadNextBlockStats() {
    console.log("Loading stats for next block...");
    this.loadingNextBlockStats = true;

    // The GetBlockTemplate endpoint requires a username so we have two randomly
    // generated pub keys to use as dummies in main / test net.
    let dummyPubKey = "BC1YLgqAkAJ4sX2YGD85j9rEpTqDrAkgLoXwv6oTzaCyZt3cDpqk8hy";
    if (this.globalVars.isTestnet) {
      dummyPubKey = "tBCKYKKdGQpCUYaG2pGy6LcNDeydSXYRHV4phywuc6bZANavsx3Y5f";
    }

    this.backendApi
      .GetBlockTemplate(this.globalVars.localNode, dummyPubKey)
      .subscribe(
        (res) => {
          this.nextBlockStats = res.LatestBlockTemplateStats;
        },
        (err) => {
          console.log(err);
        }
      )
      .add(() => {
        this.loadingNextBlockStats = false;
      });
  }

  _loadGlobalParams() {
    this.loadingGlobalParams = true;
    this.backendApi
      .GetGlobalParams(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe(
        (res) => {
          this.globalParams = {
            USDPerBitcoin: res.USDCentsPerBitcoin / 100,
            CreateProfileFeeNanos: res.CreateProfileFeeNanos / 1e9,
            MinimumNetworkFeeNanosPerKB: res.MinimumNetworkFeeNanosPerKB,
            MaxCopiesPerNFT: res.MaxCopiesPerNFT,
            CreateNFTFeeNanos: res.CreateNFTFeeNanos / 1e9,
          };
          this.updateGlobalParamsValues = this.globalParams;
        },
        (err) => {
          this.globalVars._alertError("Error global params: " + this.backendApi.stringifyError(err));
        }
      )
      .add(() => {
        this.loadingGlobalParams = false;
      });
  }

  _loadBuyBitCloutFeeRate(): void {
    this.backendApi.GetBuyBitCloutFeeBasisPoints(this.globalVars.localNode).subscribe(
      (res) => (this.buyBitCloutFeeRate = res.BuyBitCloutFeeBasisPoints / 100),
      (err) => console.log(err)
    );
  }

  _loadUSDToBitCloutReserveExchangeRate(): void {
    this.backendApi.GetUSDCentsToBitCloutReserveExchangeRate(this.globalVars.localNode).subscribe(
      (res) => (this.usdToBitCloutReserveExchangeRate = res.USDCentsPerBitClout / 100),
      (err) => console.log(err)
    );
  }

  _toggleDbDetails() {
    if (this.dbDetailsLoading) {
      // If we are currently loading the db details, return.
      return;
    }

    if (this.dbDetailsOpen) {
      // If the db details are open close them and return.
      this.dbDetailsOpen = false;
      return;
    }

    // If we pass the above checks, load the db details.
    this.dbDetailsLoading = true;

    this.backendApi
      .AdminGetAllUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        1000 // NumToFetch
      )
      .subscribe(
        (res) => {
          this.userMetadataMap = res.PubKeyToUserGlobalMetadata;
          this.usernameMap = res.PubKeyToUsername;
          this.userMetadataMapLength = Object.keys(this.userMetadataMap).length;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.dbDetailsOpen = true;
        this.dbDetailsLoading = false;
      });
  }

  _removeNilPosts() {
    this.removingNilPosts = true;
    this.backendApi
      .AdminRemoveNilPosts(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check, 1000)
      .subscribe(
        () => {
          this.removingNilPosts = false;
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      );
  }

  updateProfileModerationLevel(level: string) {
    let targetPubKeyOrUsername = "";
    let pubKey = "";
    let username = "";
    let removeEverywhere = false;
    let removeFromLeaderboard = false;
    this.updateProfileSuccessType = "";
    clearTimeout(this.clearSuccessTimeout);

    // Determine what variables to set based on the button pressed.
    if (level === "blacklist") {
      console.log("Blacklisting Pub Key: " + this.blacklistPubKeyOrUsername);
      targetPubKeyOrUsername = this.blacklistPubKeyOrUsername;
      removeEverywhere = true;
      removeFromLeaderboard = true;
      this.submittingBlacklistUpdate = true;
    } else if (level === "graylist") {
      console.log("Graylisting Pub Key: " + this.graylistPubKeyOrUsername);
      targetPubKeyOrUsername = this.graylistPubKeyOrUsername;
      removeEverywhere = false;
      removeFromLeaderboard = true;
      this.submittingGraylistUpdate = true;
    } else if (level === "unrestrict") {
      console.log("Unrestricting Pub Key: " + this.unrestrictPubKeyOrUsername);
      targetPubKeyOrUsername = this.unrestrictPubKeyOrUsername;
      removeEverywhere = false;
      removeFromLeaderboard = false;
      this.submittingUnrestrictUpdate = true;
    } else {
      console.log("Cannot set moderation level to: " + level);
      return;
    }

    // Decipher whether the target string is a pub key or username.
    if (this.globalVars.isMaybePublicKey(targetPubKeyOrUsername)) {
      pubKey = targetPubKeyOrUsername;
    } else {
      username = targetPubKeyOrUsername;
    }

    // Fire off the request.
    this.submittingProfileUpdateType = level;
    this.backendApi
      .AdminUpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username,
        true,
        removeEverywhere,
        removeFromLeaderboard,
        false,
        false,
        false
      )
      .subscribe(
        (res) => {
          this.updateProfileSuccessType = level;
          this.clearSuccessTimeout = setTimeout(() => {
            this.updateProfileSuccessType = "";
          }, 1000);
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        if (level === "blacklist") {
          this.submittingBlacklistUpdate = false;
          this.blacklistPubKeyOrUsername = "";
        } else if (level === "graylist") {
          this.submittingGraylistUpdate = false;
          this.graylistPubKeyOrUsername = "";
        } else if (level === "unrestrict") {
          this.submittingUnrestrictUpdate = false;
          this.unrestrictPubKeyOrUsername = "";
        }
      });
  }

  whitelistClicked() {
    let pubKey = "";
    let username = "";
    this.submittingWhitelistUpdate = true;
    clearTimeout(this.whitelistSuccessTimeout);

    // Decipher whether the target string is a pub key or username.
    if (this.globalVars.isMaybePublicKey(this.whitelistPubKeyOrUsername)) {
      pubKey = this.whitelistPubKeyOrUsername;
    } else {
      username = this.whitelistPubKeyOrUsername;
    }

    this.backendApi
      .AdminUpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username,
        false,
        false,
        false,
        true,
        true,
        false
      )
      .subscribe(
        (res) => {
          this.whitelistUpdateSuccess = true;
          this.whitelistSuccessTimeout = setTimeout(() => {
            this.whitelistUpdateSuccess = false;
          }, 1000);
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.submittingWhitelistUpdate = false;
        this.whitelistPubKeyOrUsername = "";
      });
  }

  unwhitelistClicked() {
    let pubKey = "";
    let username = "";
    this.submittingUnwhitelistUpdate = true;
    clearTimeout(this.unwhitelistSuccessTimeout);

    // Decipher whether the target string is a pub key or username.
    if (this.globalVars.isMaybePublicKey(this.unwhitelistPubKeyOrUsername)) {
      pubKey = this.unwhitelistPubKeyOrUsername;
    } else {
      username = this.unwhitelistPubKeyOrUsername;
    }

    this.backendApi
      .AdminUpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username,
        false,
        false,
        false,
        true,
        false,
        false
      )
      .subscribe(
        (res) => {
          this.unwhitelistUpdateSuccess = true;
          this.unwhitelistSuccessTimeout = setTimeout(() => {
            this.unwhitelistUpdateSuccess = false;
          }, 1000);
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.submittingUnwhitelistUpdate = false;
        this.unwhitelistPubKeyOrUsername = "";
      });
  }

  submitRemovePhoneNumber() {
    const targetPubKeyOrUsername = this.removePhonePubKeyorUsername;
    let pubKey = "";
    let username = "";

    if (this.globalVars.isMaybePublicKey(targetPubKeyOrUsername)) {
      pubKey = targetPubKeyOrUsername;
    } else {
      username = targetPubKeyOrUsername;
    }

    this.submittingRemovePhone = true;

    this.backendApi
      .AdminUpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        pubKey,
        username,
        false,
        false,
        false,
        false,
        false,
        true
      )
      .subscribe(
        (res) => {
          this.updateProfileSuccessType = "phone";
          this.clearSuccessTimeout = setTimeout(() => {
            this.updateProfileSuccessType = "";
          }, 1000);
        },
        (err) => {
          this.globalVars._alertError(JSON.stringify(err.error));
        }
      )
      .add(() => {
        this.submittingRemovePhone = false;
      });
  }

  extractError(err: any): string {
    if (err.error != null && err.error.error != null) {
      // Is it obvious yet that I'm not a frontend gal?
      // TODO: Error handling between BE and FE needs a major redesign.
      const rawError = err.error.error;
      if (rawError.includes("password")) {
        return Messages.INCORRECT_PASSWORD;
      } else if (rawError.includes("not sufficient")) {
        return Messages.INSUFFICIENT_BALANCE;
      } else if (rawError.includes("RuleErrorTxnMustHaveAtLeastOneInput")) {
        return Messages.SEND_BITCLOUT_MIN;
      } else if (
        (rawError.includes("SendBitClout: Problem") && rawError.includes("Invalid input format")) ||
        rawError.includes("Checksum does not match")
      ) {
        return Messages.INVALID_PUBLIC_KEY;
      } else {
        return rawError;
      }
    }
    if (err.status != null && err.status !== 200) {
      return Messages.CONNECTION_PROBLEM;
    }
    // If we get here we have no idea what went wrong so just alert the
    // errorString.
    return JSON.stringify(err);
  }

  updateGlobalParamUSDPerBitcoin() {
    this.updatingUSDToBitcoin = true;
    this.updateGlobalParams(this.updateGlobalParamsValues.USDPerBitcoin, -1, -1, -1, -1);
  }

  updateGlobalParamCreateProfileFee() {
    this.updatingCreateProfileFee = true;
    this.updateGlobalParams(-1, this.updateGlobalParamsValues.CreateProfileFeeNanos, -1, -1, -1);
  }

  updateGlobalParamMinimumNetworkFee() {
    this.updatingMinimumNetworkFee = true;
    this.updateGlobalParams(-1, -1, this.updateGlobalParamsValues.MinimumNetworkFeeNanosPerKB, -1, -1);
  }

  updateGlobalParamMaxCopiesPerNFT() {
    this.updatingMaxCopiesPerNFT = true;
    this.updateGlobalParams(-1, -1, -1, this.updateGlobalParamsValues.MaxCopiesPerNFT, -1);
  }

  updateGlobalParamCreateNFTFeeNanos() {
    this.updatingCreateNFTFeeNanos = true;
    this.updateGlobalParams(-1, -1, -1, -1, this.updateGlobalParamsValues.CreateNFTFeeNanos);
  }

  updateUSDToBitCloutReserveExchangeRate(): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `You are about to update the reserve exchange rate of USD to BitClout to be $${this.usdToBitCloutReserveExchangeRate}`,
      showConfirmButton: true,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.submittingUSDToBitCloutReserveExchangeRateUpdate = true;
        this.backendApi
          .SetUSDCentsToBitCloutReserveExchangeRate(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.usdToBitCloutReserveExchangeRate * 100
          )
          .subscribe(
            (res: any) => {
              console.log(res);
              this.globalVars._alertSuccess(
                sprintf("Successfully updated the reserve exchange to $%d/BitClout", res.USDCentsPerBitClout / 100)
              );
            },
            (err: any) => {
              this.globalVars._alertError(this.extractError(err));
            }
          )
          .add(() => (this.submittingUSDToBitCloutReserveExchangeRateUpdate = false));
      }
    });
  }

  updateBuyBitCloutFeeRate(): void {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `You are about to update the Buy BitClout Fee to be ${this.buyBitCloutFeeRate}%`,
      showConfirmButton: true,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.submittingBuyBitCloutFeeRate = true;
        this.backendApi
          .SetBuyBitCloutFeeBasisPoints(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.buyBitCloutFeeRate * 100
          )
          .subscribe(
            (res: any) => {
              console.log(res);
              this.globalVars._alertSuccess(
                sprintf("Successfully updated the Buy BitClout Fee to %d%", res.USDCentsPerBitClout / 100)
              );
            },
            (err: any) => {
              this.globalVars._alertError(this.extractError(err));
            }
          )
          .add(() => (this.submittingBuyBitCloutFeeRate = false));
      }
    });
  }

  updateGlobalParams(
    usdPerBitcoin: number,
    createProfileFeeNanos: number,
    minimumNetworkFeeNanosPerKB: number,
    maxCopiesPerNFT: number,
    createNFTFeeNanos: number
  ) {
    const updateBitcoinMessage = usdPerBitcoin >= 0 ? `Update Bitcoin to USD exchange rate: ${usdPerBitcoin}\n` : "";
    const createProfileFeeNanosMessage =
      createProfileFeeNanos >= 0 ? `Create Profile Fee (in $CLOUT): ${createProfileFeeNanos}\n` : "";
    const minimumNetworkFeeNanosPerKBMessage =
      minimumNetworkFeeNanosPerKB >= 0 ? `Minimum Network Fee Nanos Per KB: ${minimumNetworkFeeNanosPerKB}\n` : "";
    const maxCopiesMessage = maxCopiesPerNFT >= 0 ? `Max Copies Per NFT: ${maxCopiesPerNFT}\n` : "";
    const createNFTFeeNanosMessage = createNFTFeeNanos >= 0 ? `Create NFT Fee (in $CLOUT): ${createNFTFeeNanos}\n` : "";
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `${updateBitcoinMessage}${createProfileFeeNanosMessage}${minimumNetworkFeeNanosPerKBMessage}${maxCopiesMessage}${createNFTFeeNanosMessage}`,
      showConfirmButton: true,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    })
      .then((res: any) => {
        if (res.isConfirmed) {
          this.updatingGlobalParams = true;
          console.log(maxCopiesPerNFT);
          this.backendApi
            .UpdateGlobalParams(
              this.globalVars.localNode,
              this.globalVars.loggedInUser.PublicKeyBase58Check,
              usdPerBitcoin >= 0 ? usdPerBitcoin * 100 : -1,
              createProfileFeeNanos >= 0 ? createProfileFeeNanos * 1e9 : -1,
              minimumNetworkFeeNanosPerKB >= 0 ? minimumNetworkFeeNanosPerKB : -1,
              maxCopiesPerNFT >= 0 ? maxCopiesPerNFT : -1,
              createNFTFeeNanos >= 0 ? createNFTFeeNanos * 1e9 : -1,
              minimumNetworkFeeNanosPerKB >= 0
                ? minimumNetworkFeeNanosPerKB
                : this.globalParams.MinimumNetworkFeeNanosPerKB >= 0
                ? this.globalParams.MinimumNetworkFeeNanosPerKB
                : Math.floor(parseFloat(this.feeRateBitCloutPerKB) * 1e9)
            )
            .subscribe(
              (res: any) => {
                if (res == null || res.FeeNanos == null) {
                  this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
                  return null;
                }
                // Save the minimum network fee in case we update that value then update a different global param without
                // updating the minimum network fee.
                if (minimumNetworkFeeNanosPerKB >= 0) {
                  this.globalParams.MinimumNetworkFeeNanosPerKB = minimumNetworkFeeNanosPerKB;
                }
                const totalFeeBitClout = res.FeeNanos / 1e9;

                this.globalVars._alertSuccess(
                  sprintf(
                    "Successfully updated global params rate. TxID: %s for a fee of %d BitClout",
                    res.TransactionIDBase58Check,
                    totalFeeBitClout
                  )
                );
              },
              (error) => {
                console.error(error);
                this.globalVars._alertError(this.extractError(error));
              }
            )
            .add(() => {
              this.updatingGlobalParams = false;
            });
        }
      })
      .finally(() => {
        this.updatingUSDToBitcoin = false;
        this.updatingCreateProfileFee = false;
        this.updatingMinimumNetworkFee = false;
        this.updatingMaxCopiesPerNFT = false;
        this.updatingCreateNFTFeeNanos = false;
      });
  }

  reprocessBitcoinBlock() {
    if (this.bitcoinBlockHashOrHeight === "") {
      this.globalVars._alertError("Please enter either a Bitcoin block hash or a Bitcoin block height.");
      return;
    }

    this.submittingReprocessRequest = true;
    this.backendApi
      .AdminReprocessBitcoinBlock(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.bitcoinBlockHashOrHeight
      )
      .subscribe(
        (res: any) => {
          if (res == null || res.Message == null) {
            this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
            return null;
          }
          this.bitcoinBlockHashOrHeight = "";
          this.globalVars._alertSuccess(res.Message);
        },
        (error) => {
          console.error(error);
          this.globalVars._alertError(this.extractError(error));
        }
      )
      .add(() => {
        this.submittingReprocessRequest = false;
      });
  }

  evictBitcoinExchangeTxns(dryRun: boolean) {
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: `About to evict ${this.evictBitcoinTxnHashes} with DryRun=${dryRun}`,
      showConfirmButton: true,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    })
      .then((res: any) => {
        if (res.isConfirmed) {
          this.submittingEvictUnminedBitcoinTxns = true;
          this.backendApi
            .EvictUnminedBitcoinTxns(
              this.globalVars.localNode,
              this.globalVars.loggedInUser.PublicKeyBase58Check,
              this.evictBitcoinTxnHashes.split(","),
              dryRun
            )
            .subscribe(
              (res: any) => {
                if (res == null) {
                  this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
                  return null;
                }

                this.globalVars._alertSuccess(
                  `Success! Lost ${res.TotalMempoolTxns - res.MempoolTxnsLeftAfterEviction} mempool
                  txns with ${res.TotalMempoolTxns} total txns in the mempool before eviction.
                  Types: ${JSON.stringify(res.TxnTypesEvicted, null, 2)}.
                  Check the response of this request in the browser's inspector for more information.`
                );
              },
              (error) => {
                console.error(error);
                this.globalVars._alertError(this.extractError(error));
              }
            )
            .add(() => {
              this.submittingEvictUnminedBitcoinTxns = false;
            });
        }
      })
      .finally(() => {
        this.submittingEvictUnminedBitcoinTxns = false;
      });
  }

  grantVerificationBadge() {
    if (this.usernameToVerify === "") {
      this.globalVars._alertError("Please enter a valid username.");
      return;
    }

    this.submittingVerifyRequest = true;
    this.backendApi
      .AdminGrantVerificationBadge(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.usernameToVerify
      )
      .subscribe(
        (res: any) => {
          this.globalVars._alertSuccess(res.Message);
        },
        (error) => {
          this.globalVars._alertError(this.extractError(error));
        }
      )
      .add(() => {
        this.submittingVerifyRequest = false;
      });
  }

  getUserAdminDataClicked() {
    if (this.getUserAdminDataPublicKey === "") {
      this.globalVars._alertError("Please enter a valid username.");
      return;
    }

    this.submittingGetUserAdminData = true;
    this.backendApi
      .AdminGetUserAdminData(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.getUserAdminDataPublicKey
      )
      .subscribe(
        (res: any) => {
          this.getUserAdminDataResponse = res;
        },
        (error) => {
          this.globalVars._alertError(this.extractError(error));
        }
      )
      .add(() => {
        this.submittingGetUserAdminData = false;
      });
  }

  RemoveVerification() {
    if (this.usernameForWhomToRemoveVerification === "") {
      this.globalVars._alertError("Please enter a valid username.");
      return;
    }

    this.submittingRemovalRequest = true;
    this.backendApi
      .AdminRemoveVerificationBadge(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.usernameForWhomToRemoveVerification
      )
      .subscribe(
        (res: any) => {
          this.globalVars._alertSuccess(res.Message);
        },
        (error) => {
          this.globalVars._alertError(this.extractError(error));
        }
      )
      .add(() => {
        this.submittingRemovalRequest = false;
      });
  }

  swapIdentity() {
    if (this.swapIdentityFromUsernameOrPublicKey === "") {
      this.globalVars._alertError("Please enter the username or public key of the user you are swapping *from*");
      return;
    }
    if (this.swapIdentityToUsernameOrPublicKey === "") {
      this.globalVars._alertError("Please enter the username or public key of the user you are swapping *to*");
      return;
    }

    this.submittingSwapIdentity = true;
    this.backendApi
      .SwapIdentity(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.swapIdentityFromUsernameOrPublicKey,
        this.swapIdentityToUsernameOrPublicKey,
        Math.floor(parseFloat(this.feeRateBitCloutPerKB) * 1e9) /*MinFeeRateNanosPerKB*/
      )
      .subscribe(
        (res: any) => {
          if (res == null) {
            this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
            return null;
          }
          this.globalVars._alertSuccess("Identities successfully swapped!");
        },
        (error) => {
          console.error(error);
          this.globalVars._alertError(this.extractError(error));
        }
      )
      .add(() => {
        this.submittingSwapIdentity = false;
      });
  }

  // GetUserMetadata
  getUserMetadata() {
    this.backendApi
      .AdminGetUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.changeUsernamePublicKey
      )
      .subscribe(
        (res) => {
          this.userMetadataToUpdate = res.UserMetadata;
          this.userProfileEntryResponseToUpdate = res.UserProfileEntryResponse;
          this.searchedForPubKey = true;
        },
        (err) => {
          console.log(err);
        }
      );
  }

  updateUsername() {
    if (!this.searchedForPubKey) {
      return SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: "warning",
        title: "Search for public key before updating username",
      });
    }
    const infoMsg = this.userProfileEntryResponseToUpdate
      ? `Change ${this.userProfileEntryResponseToUpdate.Username} to ${this.usernameTarget}`
      : `Set username to ${this.usernameTarget} for public key ${this.changeUsernamePublicKey}`;
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      icon: "info",
      title: `Updating Username`,
      html: infoMsg,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        this.submittingUpdateUsername = true;
        const creatorCoinBasisPoints = this.userProfileEntryResponseToUpdate?.CoinEntry?.CreatorBasisPoints || 10 * 100;
        const stakeMultipleBasisPoints =
          this.userProfileEntryResponseToUpdate?.StakeMultipleBasisPoints || 1.25 * 100 * 100;
        return this.backendApi
          .UpdateProfile(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
            this.changeUsernamePublicKey /*ProfilePublicKeyBase58Check*/,
            // Start params
            this.usernameTarget /*NewUsername*/,
            "" /*NewDescription*/,
            "" /*NewProfilePic*/,
            creatorCoinBasisPoints /*NewCreatorBasisPoints*/,
            stakeMultipleBasisPoints /*NewStakeMultipleBasisPoints*/,
            false /*IsHidden*/,
            // End params
            this.globalVars.feeRateBitCloutPerKB * 1e9 /*MinFeeRateNanosPerKB*/
          )
          .subscribe(
            () => {
              this.updateProfileSuccessType = "username";
              this.clearSuccessTimeout = setTimeout(() => {
                this.updateProfileSuccessType = "";
              }, 1000);
            },
            (err) => {
              this.globalVars._alertError(JSON.stringify(err.error));
            }
          )
          .add(() => {
            this.submittingUpdateUsername = false;
          });
      }
    });
  }
}
