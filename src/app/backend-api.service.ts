// FYI: any request that needs the HttpOnly cookie to be sent (e.g. b/c the server
// needs the seed phrase) needs the {withCredentials: true} option. It may also needed to
// get the browser to save the cookie in the response.
// https://github.com/github/fetch#sending-cookies
import { Injectable } from '@angular/core';
import { from, interval, Observable, of, throwError, zip } from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  filter,
  take,
  concatMap,
  timeout,
  tap,
} from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { IdentityMessagingResponse, IdentityService } from './identity.service';
import { environment } from 'src/environments/environment';
import { Hex } from 'web3-utils/types';
import { SwalHelper } from '../lib/helpers/swal-helper';

export class BackendRoutes {
  static ExchangeRateRoute = '/api/v0/get-exchange-rate';
  static ExchangeBitcoinRoute = '/api/v0/exchange-bitcoin';
  static SendDeSoRoute = '/api/v0/send-deso';
  static MinerControlRoute = '/api/v0/miner-control';

  static GetUsersStatelessRoute = '/api/v0/get-users-stateless';
  static RoutePathSubmitPost = '/api/v0/submit-post';
  static RoutePathUploadImage = '/api/v0/upload-image';
  static RoutePathSubmitTransaction = '/api/v0/submit-transaction';
  static RoutePathUpdateProfile = '/api/v0/update-profile';
  static RoutePathGetPostsStateless = '/api/v0/get-posts-stateless';
  static RoutePathGetHotFeed = '/api/v0/get-hot-feed';
  static RoutePathGetProfiles = '/api/v0/get-profiles';
  static RoutePathGetSingleProfile = '/api/v0/get-single-profile';
  static RoutePathGetSingleProfilePicture =
    '/api/v0/get-single-profile-picture';
  static RoutePathGetPostsForPublicKey = '/api/v0/get-posts-for-public-key';
  static RoutePathGetDiamondedPosts = '/api/v0/get-diamonded-posts';
  static RoutePathGetHodlersForPublicKey = '/api/v0/get-hodlers-for-public-key';
  static RoutePathIsHodlingPublicKey = '/api/v0/is-hodling-public-key';
  static RoutePathSendMessageStateless = '/api/v0/send-message-stateless';
  static RoutePathGetMessagesStateless = '/api/v0/get-messages-stateless';
  static GetAllMessagingGroupKeys = '/api/v0/get-all-messaging-group-keys';
  static RoutePathCheckPartyMessagingKeys =
    '/api/v0/check-party-messaging-keys';
  static RegisterGroupMessagingKey = '/api/v0/register-messaging-group-key';
  static RoutePathMarkContactMessagesRead =
    '/api/v0/mark-contact-messages-read';
  static RoutePathMarkAllMessagesRead = '/api/v0/mark-all-messages-read';
  static RoutePathGetFollowsStateless = '/api/v0/get-follows-stateless';
  static RoutePathCreateFollowTxnStateless =
    '/api/v0/create-follow-txn-stateless';
  static RoutePathCreateLikeStateless = '/api/v0/create-like-stateless';
  static RoutePathBuyOrSellCreatorCoin = '/api/v0/buy-or-sell-creator-coin';
  static RoutePathTransferCreatorCoin = '/api/v0/transfer-creator-coin';
  static RoutePathUpdateUserGlobalMetadata =
    '/api/v0/update-user-global-metadata';
  static RoutePathGetUserGlobalMetadata = '/api/v0/get-user-global-metadata';
  static RoutePathGetNotifications = '/api/v0/get-notifications';
  static RoutePathGetAppState = '/api/v0/get-app-state';
  static RoutePathGetSinglePost = '/api/v0/get-single-post';
  static RoutePathSendPhoneNumberVerificationText =
    '/api/v0/send-phone-number-verification-text';
  static RoutePathSubmitPhoneNumberVerificationCode =
    '/api/v0/submit-phone-number-verification-code';
  static RoutePathBlockPublicKey = '/api/v0/block-public-key';
  static RoutePathGetBlockTemplate = '/api/v0/get-block-template';
  static RoutePathGetTxn = '/api/v0/get-txn';
  static RoutePathDeleteIdentities = '/api/v0/delete-identities';
  static RoutePathSendDiamonds = '/api/v0/send-diamonds';
  static RoutePathGetDiamondsForPublicKey =
    '/api/v0/get-diamonds-for-public-key';
  static RoutePathGetLikesForPost = '/api/v0/get-likes-for-post';
  static RoutePathGetDiamondsForPost = '/api/v0/get-diamonds-for-post';
  static RoutePathGetRepostsForPost = '/api/v0/get-reposts-for-post';
  static RoutePathGetQuoteRepostsForPost = '/api/v0/get-quote-reposts-for-post';
  static RoutePathGetJumioStatusForPublicKey =
    '/api/v0/get-jumio-status-for-public-key';
  static RoutePathGetUserMetadata = '/api/v0/get-user-metadata';
  static RoutePathGetUsernameForPublicKey =
    '/api/v0/get-user-name-for-public-key';
  static RoutePathGetPublicKeyForUsername =
    '/api/v0/get-public-key-for-user-name';

  // Verify
  static RoutePathVerifyEmail = '/api/v0/verify-email';
  static RoutePathResendVerifyEmail = '/api/v0/resend-verify-email';

  // Delete PII
  static RoutePathDeletePII = '/api/v0/delete-pii';

  // Tutorial
  static RoutePathStartOrSkipTutorial = '/api/v0/start-or-skip-tutorial';
  static RoutePathCompleteTutorial = '/api/v0/complete-tutorial';
  static RoutePathGetTutorialCreators = '/api/v0/get-tutorial-creators';

  // Media
  static RoutePathUploadVideo = '/api/v0/upload-video';
  static RoutePathGetVideoStatus = '/api/v0/get-video-status';

  // NFT routes.
  static RoutePathCreateNft = '/api/v0/create-nft';
  static RoutePathUpdateNFT = '/api/v0/update-nft';
  static RoutePathCreateNFTBid = '/api/v0/create-nft-bid';
  static RoutePathAcceptNFTBid = '/api/v0/accept-nft-bid';
  static RoutePathGetNFTBidsForNFTPost = '/api/v0/get-nft-bids-for-nft-post';
  static RoutePathGetNFTsForUser = '/api/v0/get-nfts-for-user';
  static RoutePathGetNFTBidsForUser = '/api/v0/get-nft-bids-for-user';
  static RoutePathGetNFTShowcase = '/api/v0/get-nft-showcase';
  static RoutePathGetNextNFTShowcase = '/api/v0/get-next-nft-showcase';
  static RoutePathGetNFTCollectionSummary =
    '/api/v0/get-nft-collection-summary';
  static RoutePathGetNFTEntriesForPostHash =
    '/api/v0/get-nft-entries-for-nft-post';
  static RoutePathTransferNFT = '/api/v0/transfer-nft';
  static RoutePathAcceptNFTTransfer = '/api/v0/accept-nft-transfer';
  static RoutePathBurnNFT = '/api/v0/burn-nft';

  // DAO routes
  static RoutePathDAOCoin = '/api/v0/dao-coin';
  static RoutePathTransferDAOCoin = '/api/v0/transfer-dao-coin';

  // ETH
  static RoutePathSubmitETHTx = '/api/v0/submit-eth-tx';
  static RoutePathQueryETHRPC = '/api/v0/query-eth-rpc';

  // Admin routes.
  static NodeControlRoute = '/api/v0/admin/node-control';
  static ReprocessBitcoinBlockRoute = '/api/v0/admin/reprocess-bitcoin-block';
  static RoutePathSwapIdentity = '/api/v0/admin/swap-identity';
  static RoutePathAdminUpdateUserGlobalMetadata =
    '/api/v0/admin/update-user-global-metadata';
  static RoutePathAdminUpdateUsernameBlacklist =
    '/api/v0/admin/update-username-blacklist';
  static RoutePathAdminResetPhoneNumber = '/api/v0/admin/reset-phone-number';
  static RoutePathAdminGetAllUserGlobalMetadata =
    '/api/v0/admin/get-all-user-global-metadata';
  static RoutePathAdminGetUserGlobalMetadata =
    '/api/v0/admin/get-user-global-metadata';
  static RoutePathAdminUpdateGlobalFeed = '/api/v0/admin/update-global-feed';
  static RoutePathAdminPinPost = '/api/v0/admin/pin-post';
  static RoutePathAdminRemoveNilPosts = '/api/v0/admin/remove-nil-posts';
  static RoutePathAdminGetMempoolStats = '/api/v0/admin/get-mempool-stats';
  static RoutePathAdminGrantVerificationBadge =
    '/api/v0/admin/grant-verification-badge';
  static RoutePathAdminRemoveVerificationBadge =
    '/api/v0/admin/remove-verification-badge';
  static RoutePathAdminGetVerifiedUsers = '/api/v0/admin/get-verified-users';
  static RoutePathAdminGetUserAdminData = '/api/v0/admin/get-user-admin-data';
  static RoutePathAdminGetUsernameVerificationAuditLogs =
    '/api/v0/admin/get-username-verification-audit-logs';
  static RoutePathUpdateGlobalParams = '/api/v0/admin/update-global-params';
  static RoutePathSetUSDCentsToDeSoReserveExchangeRate =
    '/api/v0/admin/set-usd-cents-to-deso-reserve-exchange-rate';
  static RoutePathGetUSDCentsToDeSoReserveExchangeRate =
    '/api/v0/admin/get-usd-cents-to-deso-reserve-exchange-rate';
  static RoutePathSetBuyDeSoFeeBasisPoints =
    '/api/v0/admin/set-buy-deso-fee-basis-points';
  static RoutePathAdminSetCaptchaRewardNanos =
    '/api/v0/admin/set-captcha-reward-nanos';
  static RoutePathGetBuyDeSoFeeBasisPoints =
    '/api/v0/admin/get-buy-deso-fee-basis-points';
  static RoutePathAdminGetGlobalParams = '/api/v0/admin/get-global-params';
  static RoutePathGetGlobalParams = '/api/v0/get-global-params';
  static RoutePathEvictUnminedBitcoinTxns =
    '/api/v0/admin/evict-unmined-bitcoin-txns';
  static RoutePathGetWyreWalletOrdersForPublicKey =
    '/api/v0/admin/get-wyre-wallet-orders-for-public-key';
  static RoutePathAdminGetNFTDrop = '/api/v0/admin/get-nft-drop';
  static RoutePathAdminUpdateNFTDrop = '/api/v0/admin/update-nft-drop';
  static RoutePathAdminResetJumioForPublicKey =
    '/api/v0/admin/reset-jumio-for-public-key';
  static RoutePathAdminUpdateJumioDeSo = '/api/v0/admin/update-jumio-deso';
  static RoutePathAdminUpdateTutorialCreators =
    '/api/v0/admin/update-tutorial-creators';
  static RoutePathAdminResetTutorialStatus =
    '/api/v0/admin/reset-tutorial-status';
  static RoutePathAdminGetTutorialCreators =
    '/api/v0/admin/get-tutorial-creators';
  static RoutePathAdminJumioCallback = '/api/v0/admin/jumio-callback';
  static RoutePathAdminGetAllCountryLevelSignUpBonuses =
    '/api/v0/admin/get-all-country-level-sign-up-bonuses';
  static RoutePathAdminUpdateJumioCountrySignUpBonus =
    '/api/v0/admin/update-jumio-country-sign-up-bonus';
  static RoutePathAdminUpdateJumioUSDCents =
    '/api/v0/admin/update-jumio-usd-cents';
  static RoutePathAdminUpdateJumioKickbackUSDCents =
    '/api/v0/admin/update-jumio-kickback-usd-cents';
  static RoutePathAdminGetUnfilteredHotFeed =
    '/api/v0/admin/get-unfiltered-hot-feed';
  static RoutePathAdminGetHotFeedAlgorithm =
    '/api/v0/admin/get-hot-feed-algorithm';
  static RoutePathAdminUpdateHotFeedAlgorithm =
    '/api/v0/admin/update-hot-feed-algorithm';
  static RoutePathAdminUpdateHotFeedPostMultiplier =
    '/api/v0/admin/update-hot-feed-post-multiplier';
  static RoutePathAdminUpdateHotFeedUserMultiplier =
    '/api/v0/admin/update-hot-feed-user-multiplier';
  static RoutePathAdminGetHotFeedUserMultiplier =
    '/api/v0/admin/get-hot-feed-user-multiplier';

  // Referral program admin routes.
  static RoutePathAdminCreateReferralHash =
    '/api/v0/admin/create-referral-hash';
  static RoutePathAdminGetAllReferralInfoForUser =
    '/api/v0/admin/get-all-referral-info-for-user';
  static RoutePathAdminUpdateReferralHash =
    '/api/v0/admin/update-referral-hash';
  static RoutePathAdminDownloadReferralCSV =
    '/api/v0/admin/download-referral-csv';
  static RoutePathAdminUploadReferralCSV = '/api/v0/admin/upload-referral-csv';

  // Referral program non-admin routes
  static RoutePathGetReferralInfoForUser = '/api/v0/get-referral-info-for-user';
  static RoutePathGetReferralInfoForReferralHash =
    '/api/v0/get-referral-info-for-referral-hash';

  static RoutePathGetFullTikTokURL = '/api/v0/get-full-tiktok-url';

  // Wyre routes.
  static RoutePathGetWyreWalletOrderQuotation =
    '/api/v0/get-wyre-wallet-order-quotation';
  static RoutePathGetWyreWalletOrderReservation =
    '/api/v0/get-wyre-wallet-order-reservation';

  // Admin Node Fee routes
  static RoutePathAdminSetTransactionFeeForTransactionType =
    '/api/v0/admin/set-txn-fee-for-txn-type';
  static RoutePathAdminSetAllTransactionFees = '/api/v0/admin/set-all-txn-fees';
  static RoutePathAdminGetTransactionFeeMap =
    '/api/v0/admin/get-transaction-fee-map';
  static RoutePathAdminAddExemptPublicKey =
    '/api/v0/admin/add-exempt-public-key';
  static RoutePathAdminGetExemptPublicKeys =
    '/api/v0/admin/get-exempt-public-keys';

  // Supply Monitoring endpoints
  static RoutePathGetTotalSupply = '/api/v0/total-supply';
  static RoutePathGetRichList = '/api/v0/rich-list';
  static RoutePathGetCountKeysWithDESO = '/api/v0/count-keys-with-deso';

  // Lockup endpoints
  static RoutePathCoinLockup = '/api/v0/coin-lockup';
  static RoutePathUpdateCoinLockupParams = '/api/v0/update-coin-lockup-params';
  static RoutePathCoinLockupTransfer = '/api/v0/coin-lockup-transfer';
  static RoutePathCoinUnlock = '/api/v0/coin-unlock';
  static RoutePathLockupYieldCurvePoints = '/api/v0/lockup-yield-curve-points';
  static RoutePathLockedBalanceEntries = '/api/v0/locked-balance-entries';

  // GetBaseCurrencyPrice
  static RoutePathGetBaseCurrencyPrice = '/api/v0/get-base-currency-price';
}

export class Transaction {
  inputs: {
    txID: string;
    index: number;
  }[];
  outputs: {
    amountNanos: number;
    publicKeyBase58Check: string;
  }[];

  txnType: string;
  publicKeyBase58Check: string;
  signatureBytesHex: string;
}

export type DAOCoinEntryResponse = {
  CoinsInCirculationNanos: Hex;
  MintingDisabled: boolean;
  NumberOfHolders: number;
  TransferRestrictionStatus: TransferRestrictionStatusString;
  LockupTransferRestrictionStatus: TransferRestrictionStatusString;
};

export class ProfileEntryResponse {
  Username: string;
  Description: string;
  ProfilePic?: string;
  CoinEntry?: {
    DeSoLockedNanos: number;
    CoinWatermarkNanos: number;
    CoinsInCirculationNanos: number;
    CreatorBasisPoints: number;
  };
  DAOCoinEntry?: DAOCoinEntryResponse;
  CoinPriceDeSoNanos?: number;
  StakeMultipleBasisPoints?: number;
  PublicKeyBase58Check?: string;
  UsersThatHODL?: any;
  Posts?: PostEntryResponse[];
  IsReserved?: boolean;
  IsVerified?: boolean;
}

export enum TutorialStatus {
  EMPTY = '',
  STARTED = 'TutorialStarted',
  SKIPPED = 'TutorialSkipped',
  CREATE_PROFILE = 'TutorialCreateProfileComplete',
  INVEST_OTHERS_BUY = 'InvestInOthersBuyComplete',
  INVEST_OTHERS_SELL = 'InvestInOthersSellComplete',
  INVEST_SELF = 'InvestInYourselfComplete',
  DIAMOND = 'GiveADiamondComplete',
  COMPLETE = 'TutorialComplete',
}

export class User {
  ProfileEntryResponse: ProfileEntryResponse;

  PublicKeyBase58Check: string;
  PublicKeysBase58CheckFollowedByUser: string[];
  EncryptedSeedHex: string;

  BalanceNanos: number;
  UnminedBalanceNanos: number;

  NumActionItems: any;
  NumMessagesToRead: any;

  UsersYouHODL: BalanceEntryResponse[];
  UsersWhoHODLYouCount: number;

  HasPhoneNumber: boolean;
  CanCreateProfile: boolean;
  HasEmail: boolean;
  EmailVerified: boolean;
  JumioVerified: boolean;
  JumioReturned: boolean;
  JumioFinishedTime: number;

  ReferralInfoResponses: any;

  IsFeaturedTutorialWellKnownCreator: boolean;
  IsFeaturedTutorialUpAndComingCreator: boolean;

  BlockedPubKeys: { [key: string]: object };

  IsAdmin?: boolean;
  IsSuperAdmin?: boolean;

  TutorialStatus: TutorialStatus;
  CreatorPurchasedInTutorialUsername?: string;
  CreatorCoinsPurchasedInTutorial: number;
  MustCompleteTutorial: boolean;
}

export class PostEntryResponse {
  PostHashHex: string;
  PosterPublicKeyBase58Check: string;
  ParentStakeID: string;
  Body: string;
  RepostedPostHashHex: string;
  ImageURLs: string[];
  VideoURLs: string[];
  RepostPost: PostEntryResponse;
  CreatorBasisPoints: number;
  StakeMultipleBasisPoints: number;
  TimestampNanos: number;
  IsHidden: boolean;
  ConfirmationBlockHeight: number;
  // PostEntryResponse of the post that this post reposts.
  RepostedPostEntryResponse: PostEntryResponse;
  // The profile associated with this post.
  ProfileEntryResponse: ProfileEntryResponse;
  // The comments associated with this post.
  Comments: PostEntryResponse[];
  LikeCount: number;
  RepostCount: number;
  QuoteRepostCount: number;
  DiamondCount: number;
  // Information about the reader's state w/regard to this post (e.g. if they liked it).
  PostEntryReaderState?: PostEntryReaderState;
  // True if this post hash hex is in the global feed.
  InGlobalFeed: boolean;
  CommentCount: number;
  // A list of parent posts for this post (ordered: root -> closest parent post).
  ParentPosts: PostEntryResponse[];
  InMempool: boolean;
  IsPinned: boolean;
  DiamondsFromSender?: number;
  NumNFTCopies: number;
  NumNFTCopiesForSale: number;
  HasUnlockable: boolean;
  IsNFT: boolean;
  NFTRoyaltyToCoinBasisPoints: number;
  NFTRoyaltyToCreatorBasisPoints: number;
  AdditionalDESORoyaltiesMap: { [k: string]: number };
  AdditionalCoinRoyaltiesMap: { [k: string]: number };
}

export class DiamondsPost {
  Post: PostEntryResponse;
  // Boolean that is set to true when this is the first post at a given diamond level.
  ShowDiamondDivider?: boolean;
}

export class PostEntryReaderState {
  // This is true if the reader has liked the associated post.
  LikedByReader?: boolean;

  // This is true if the reader has reposted the associated post.
  RepostedByReader?: boolean;

  // This is the post hash hex of the repost
  RepostPostHashHex?: string;

  // Level of diamond the user gave this post.
  DiamondLevelBestowed?: number;
}

export class PostTxnBody {
  Body?: string;
  ImageURLs?: string[];
  VideoURLs?: string[];
}

export class BalanceEntryResponse {
  // The public keys are provided for the frontend
  HODLerPublicKeyBase58Check: string;
  // The public keys are provided for the frontend
  CreatorPublicKeyBase58Check: string;

  // Has the hodler purchased these creator coins
  HasPurchased: boolean;
  // How much this HODLer owns of a particular creator coin.
  BalanceNanos: number;
  // Use this balance for DAO Coin balances
  BalanceNanosUint256: Hex;
  // The net effect of transactions in the mempool on a given BalanceEntry's BalanceNanos.
  // This is used by the frontend to convey info about mining.
  NetBalanceInMempool: number;

  ProfileEntryResponse: ProfileEntryResponse;
}

export class CumulativeLockedBalanceEntryResponse {
  // The public key associated with the holder.
  HODLerPublicKeyBase58Check: string;

  // The public key associated with the locked DAO coins.
  ProfilePublicKeyBase58Check: string;

  // The total amount locked across all locked balance entries.
  TotalLockedBaseUnits: Hex;

  // The total amount that can be unlocked at the time the response was generated.
  UnlockableBaseUnits: Hex;

  // All unvested and vested locked balance entries.
  UnvestedLockedBalanceEntries: LockedBalanceEntryResponse[];
  VestedLockedBalanceEntries: LockedBalanceEntryResponse[];

  // The profile entry associated with the given profile.
  ProfileEntryResponse: ProfileEntryResponse;
}

export class LockedBalanceEntryResponse {
  // The public key associated with the holder.
  HODLerPublicKeyBase58Check: string;

  // The public key associated with the locked DAO coins.
  ProfilePublicKeyBase58Check: string;

  // When the unlock can begin to be unlocked.
  UnlockTimestampNanoSecs: number;

  // When the vesting schedule ends.
  VestingEndTimestampNanoSecs: number;

  // The amount of coins locked in the balance entry.
  BalanceBaseUnits: Hex;
}

export class LockupYieldCurvePointResponse {
  ProfilePublicKeyBase58Check: string;
  LockupDurationNanoSecs: number;
  LockupYieldAPYBasisPoints: number;
  ProfileEntryResponse: ProfileEntryResponse;
}

export class NFTEntryResponse {
  OwnerPublicKeyBase58Check: string;
  ProfileEntryResponse: ProfileEntryResponse | undefined;
  PostEntryResponse: PostEntryResponse | undefined;
  SerialNumber: number;
  IsForSale: boolean;
  IsPending?: boolean;
  MinBidAmountNanos: number;
  LastAcceptedBidAmountNanos: number;
  IsBuyNow: boolean;
  BuyNowPriceNanos: number;

  HighestBidAmountNanos: number;
  LowestBidAmountNanos: number;

  // only populated when the reader is the owner of the nft and there is an unlockable.
  LastOwnerPublicKeyBase58Check: string | undefined;
  EncryptedUnlockableText: string | undefined;
  DecryptedUnlockableText: string | undefined;
}

export class NFTBidEntryResponse {
  PublicKeyBase58Check: string;
  ProfileEntryResponse: ProfileEntryResponse;
  PostHashHex: string;
  PostEntryResponse: PostEntryResponse | undefined;
  SerialNumber: number;
  BidAmountNanos: number;

  HighestBidAmountNanos: number | undefined;
  LowestBidAmountNanos: number | undefined;

  BidderBalanceNanos: number;

  selected?: boolean;
}

export class NFTCollectionResponse {
  AvailableSerialNumbers: number[];
  PostEntryResponse: PostEntryResponse;
  ProfileEntryResponse: ProfileEntryResponse;
  NumCopiesForSale: number;
  HighestBidAmountNanos: number;
  LowestBidAmountNanos: number;
}

export class NFTBidData {
  PostEntryResponse: PostEntryResponse;
  NFTEntryResponses: NFTEntryResponse[];
  BidEntryResponses: NFTBidEntryResponse[];
}

export class TransactionFee {
  PublicKeyBase58Check: string;
  AmountNanos: number;
  ProfileEntryResponse?: ProfileEntryResponse;
}

export class DeSoNode {
  Name: string;
  URL: string;
  Owner: string;
}

type GetUserMetadataResponse = {
  HasPhoneNumber: boolean;
  CanCreateProfile: boolean;
  BlockedPubKeys: { [k: string]: any };
  HasEmail: boolean;
  EmailVerified: boolean;
  JumioFinishedTime: number;
  JumioVerified: boolean;
  JumioReturned: boolean;
};

type GetUsersStatelessResponse = {
  UserList: User[];
  DefaultFeeRateNanosPerKB: number;
  ParamUpdaters: { [k: string]: boolean };
};

export type RichListEntryResponse = {
  PublicKeyBase58Check: string;
  BalanceNanos: number;
  BalanceDESO: number;
  Percentage: number;
  Value: number;
};

export type CountryLevelSignUpBonus = {
  AllowCustomReferralAmount: boolean;
  ReferralAmountOverrideUSDCents: number;
  AllowCustomKickbackAmount: boolean;
  KickbackAmountOverrideUSDCents: number;
};

export type CountryCodeDetails = {
  Name: string;
  CountryCode: string;
  Alpha3: string;
};

export type CountryLevelSignUpBonusResponse = {
  CountryLevelSignUpBonus: CountryLevelSignUpBonus;
  CountryCodeDetails: CountryCodeDetails;
};

export enum DAOCoinOperationTypeString {
  MINT = 'mint',
  BURN = 'burn',
  UPDATE_TRANSFER_RESTRICTION_STATUS = 'update_transfer_restriction_status',
  DISABLE_MINTING = 'disable_minting',
}

export enum TransferRestrictionStatusString {
  UNRESTRICTED = 'unrestricted',
  PROFILE_OWNER_ONLY = 'profile_owner_only',
  DAO_MEMBERS_ONLY = 'dao_members_only',
  PERMANENTLY_UNRESTRICTED = 'permanently_unrestricted',
}

export type MessagingGroupMember = {
  GroupMemberPublicKeyBase58Check: string;
  GroupMemberKeyName: string;
  EncryptedKey: string;
};

export type MessagingGroupEntryResponse = {
  GroupOwnerPublicKeyBase58Check: string;
  MessagingPublicKeyBase58Check: string;
  MessagingGroupKeyName: string;
  MessagingGroupMembers: MessagingGroupMember[];
  EncryptedKey: string;
  ExtraData: { [k: string]: string };
};

export type GetAllMessagingGroupKeysResponse = {
  MessagingGroupEntries: MessagingGroupEntryResponse[];
};

export type MessagingGroupMemberResponse = {
  // GroupMemberPublicKeyBase58Check is the main public key of the group member.
  GroupMemberPublicKeyBase58Check: string;

  // GroupMemberKeyName is the key name of the member that we encrypt the group messaging public key to. The group
  // messaging public key should not be confused with the GroupMemberPublicKeyBase58Check, the former is the public
  // key of the whole group, while the latter is the public key of the group member.
  GroupMemberKeyName: string;

  // EncryptedKey is the encrypted private key corresponding to the group messaging public key that's encrypted
  // to the member's registered messaging key labeled with GroupMemberKeyName.
  EncryptedKey: string;
};

@Injectable({
  providedIn: 'root',
})
export class BackendApiService {
  constructor(
    private httpClient: HttpClient,
    private identityService: IdentityService
  ) {}

  static GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE = 'influencer_coin_price';
  static BUY_CREATOR_COIN_OPERATION_TYPE = 'buy';
  static SELL_CREATOR_COIN_OPERATION_TYPE = 'sell';

  // TODO: Cleanup - this should be a configurable value on the node. Leaving it in the frontend
  // is fine for now because BlockCypher has strong anti-abuse measures in place.
  blockCypherToken = 'cd455c8a5d404bb0a23880b72f56aa86';

  // Store sent messages and associated metadata in localStorage
  MessageMetaKey = 'messageMetaKey';

  // Store the identity users in localStorage
  IdentityUsersKey = 'identityUsersV2';

  // Store last local node URL in localStorage
  LastLocalNodeKey = 'lastLocalNodeV2';

  // Store last logged in user public key in localStorage
  LastLoggedInUserKey = 'lastLoggedInUserV2';

  // Store the last identity service URL in localStorage
  LastIdentityServiceKey = 'lastIdentityServiceURLV2';

  // Messaging V3 default key name.
  DefaultKey = 'default-key';

  // TODO: Wipe all this data when transition is complete
  LegacyUserListKey = 'userList';
  LegacySeedListKey = 'seedList';

  SetStorage(key: string, value: any) {
    localStorage.setItem(
      key,
      value || value === false ? JSON.stringify(value) : ''
    );
  }

  RemoveStorage(key: string) {
    localStorage.removeItem(key);
  }

  GetStorage(key: string) {
    const data = localStorage.getItem(key);
    if (data === '') {
      return null;
    }

    return JSON.parse(data);
  }

  SetEncryptedMessagingKeyRandomnessForPublicKey(
    publicKeyBase58Check: string,
    encryptedMessagingKeyRandomness: string
  ): void {
    const users = this.GetStorage(this.IdentityUsersKey);
    this.setIdentityServiceUsers({
      ...users,
      [publicKeyBase58Check]: {
        ...users[publicKeyBase58Check],
        encryptedMessagingKeyRandomness,
      },
    });
  }

  // Assemble a URL to hit the BE with.
  _makeRequestURL(
    endpoint: string,
    routeName: string,
    adminPublicKey?: string
  ): string {
    let queryURL = location.protocol + '//' + endpoint + routeName;
    // If the protocol is specified within the endpoint then use that.
    if (endpoint.startsWith('http')) {
      queryURL = endpoint + routeName;
    }
    if (adminPublicKey) {
      queryURL += `?admin_public_key=${adminPublicKey}`;
    }
    return queryURL;
  }

  _handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`
      );
    }
    // return an observable with a user-facing error message
    return throwError(error);
  }

  // Stores identity service users in identityService and localStorage
  setIdentityServiceUsers(users: any, publicKeyAdded?: string) {
    this.SetStorage(this.IdentityUsersKey, users);
    this.identityService.identityServiceUsers = users;
    this.identityService.identityServicePublicKeyAdded = publicKeyAdded;
  }

  signAndSubmitTransaction(
    endpoint: string,
    request: Observable<any>,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return request
      .pipe(
        switchMap((res) =>
          this.identityService
            .sign({
              transactionHex: res.TransactionHex,
              ...this.identityService.identityServiceParamsForKey(
                PublicKeyBase58Check
              ),
            })
            .pipe(
              switchMap((signed) => {
                if (signed.approvalRequired) {
                  return this.identityService
                    .launch('/approve', {
                      tx: res.TransactionHex,
                    })
                    .pipe(
                      map((approved) => {
                        this.setIdentityServiceUsers(approved.users);
                        return { ...res, ...approved };
                      })
                    );
                } else {
                 return of({ ...res, ...signed });
                }
              })
            )
        )
      )
      .pipe(
        switchMap((res) =>
          this.SubmitTransaction(endpoint, res.signedTransactionHex).pipe(
            map((broadcasted) => ({ ...res, ...broadcasted }))
          )
        )
      )
      .pipe(catchError(this._handleError));
  }

  get(endpoint: string, path: string) {
    return this.httpClient
      .get<any>(this._makeRequestURL(endpoint, path))
      .pipe(catchError(this._handleError));
  }

  post(endpoint: string, path: string, body: any): Observable<any> {
    return this.httpClient
      .post<any>(this._makeRequestURL(endpoint, path), body)
      .pipe(catchError(this._handleError));
  }

  jwtPost(
    endpoint: string,
    path: string,
    publicKey: string,
    body: any
  ): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(publicKey),
    });

    return request.pipe(
      switchMap((signed) => {
        body = {
          JWT: signed.jwt,
          ...body,
        };

        return this.post(endpoint, path, body).pipe(
          map((res) => ({ ...res, ...signed }))
        );
      })
    );
  }

  GetExchangeRate(endpoint: string): Observable<any> {
    return this.get(endpoint, BackendRoutes.ExchangeRateRoute);
  }

  // Use empty string to return all top categories.
  GetBitcoinFeeRateSatoshisPerKB(): Observable<any> {
    return this.httpClient
      .get<any>('https://api.blockchain.com/mempool/fees')
      .pipe(catchError(this._handleError));
  }

  SendPhoneNumberVerificationText(
    endpoint: string,
    PublicKeyBase58Check: string,
    PhoneNumber: string,
    PhoneNumberCountryCode: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathSendPhoneNumberVerificationText,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
        PhoneNumber,
        PhoneNumberCountryCode,
      }
    );
  }

  SubmitPhoneNumberVerificationCode(
    endpoint: string,
    PublicKeyBase58Check: string,
    PhoneNumber: string,
    PhoneNumberCountryCode: string,
    VerificationCode: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathSubmitPhoneNumberVerificationCode,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
        PhoneNumber,
        PhoneNumberCountryCode,
        VerificationCode,
      }
    );
  }

  GetBlockTemplate(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetBlockTemplate, {
      PublicKeyBase58Check,
      HeaderVersion: 1,
    });
  }

  GetTxn(endpoint: string, TxnHashHex: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetTxn, {
      TxnHashHex,
    });
  }

  DeleteIdentities(endpoint: string): Observable<any> {
    return this.httpClient
      .post<any>(
        this._makeRequestURL(endpoint, BackendRoutes.RoutePathDeleteIdentities),
        {},
        { withCredentials: true }
      )
      .pipe(catchError(this._handleError));
  }

  ExchangeBitcoin(
    endpoint: string,
    LatestBitcionAPIResponse: any,
    BTCDepositAddress: string,
    PublicKeyBase58Check: string,
    BurnAmountSatoshis: number,
    FeeRateSatoshisPerKB: number,
    Broadcast: boolean
  ): Observable<any> {
    // Check if the user is logged in with a derived key and operating as the owner key.
    const DerivedPublicKeyBase58Check =
      this.identityService.identityServiceUsers[PublicKeyBase58Check]
        ?.derivedPublicKeyBase58Check;

    let req = this.post(endpoint, BackendRoutes.ExchangeBitcoinRoute, {
      PublicKeyBase58Check,
      DerivedPublicKeyBase58Check,
      BurnAmountSatoshis,
      LatestBitcionAPIResponse,
      BTCDepositAddress,
      FeeRateSatoshisPerKB,
      Broadcast: false,
    });

    if (Broadcast) {
      req = req.pipe(
        switchMap((res) =>
          this.identityService
            .burn({
              ...this.identityService.identityServiceParamsForKey(
                PublicKeyBase58Check
              ),
              unsignedHashes: res.UnsignedHashes,
            })
            .pipe(map((signed) => ({ ...res, ...signed })))
        )
      );

      req = req.pipe(
        switchMap((res) =>
          this.post(endpoint, BackendRoutes.ExchangeBitcoinRoute, {
            PublicKeyBase58Check,
            DerivedPublicKeyBase58Check,
            BurnAmountSatoshis,
            LatestBitcionAPIResponse,
            BTCDepositAddress,
            FeeRateSatoshisPerKB,
            SignedHashes: res.signedHashes,
            Broadcast,
          }).pipe(map((broadcasted) => ({ ...res, ...broadcasted })))
        )
      );
    }

    return req.pipe(catchError(this._handleError));
  }

  // TODO: Use Broadcast bool isntead
  SendDeSoPreview(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    RecipientPublicKeyOrUsername: string,
    AmountNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.SendDeSoRoute, {
      SenderPublicKeyBase58Check,
      RecipientPublicKeyOrUsername,
      AmountNanos: Math.floor(AmountNanos),
      MinFeeRateNanosPerKB,
    });
  }

  SendDeSo(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    RecipientPublicKeyOrUsername: string,
    AmountNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.SendDeSoPreview(
      endpoint,
      SenderPublicKeyBase58Check,
      RecipientPublicKeyOrUsername,
      AmountNanos,
      MinFeeRateNanosPerKB
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      SenderPublicKeyBase58Check
    );
  }

  SubmitTransaction(endpoint: string, TransactionHex: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathSubmitTransaction, {
      TransactionHex,
    });
  }

  SendMessage(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    RecipientPublicKeyBase58Check: string,
    MessageText: string,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    // First check if either sender or recipient has registered the "default-key" messaging group key.
    // In V3 messages, we expect users to migrate to the V3 messages, which means they'll have the default
    // key registered on-chain. We want to automatically send messages to this default key is it's registered.
    // To check the messaging key we call the RoutePathCheckPartyMessaging keys backend API route.
    let req = this.post(
      endpoint,
      BackendRoutes.RoutePathCheckPartyMessagingKeys,
      {
        SenderPublicKeyBase58Check,
        SenderMessagingKeyName: this.DefaultKey,
        RecipientPublicKeyBase58Check,
        RecipientMessagingKeyName: this.DefaultKey,
      }
    )
      .pipe(
        switchMap((partyMessagingKeys) => {
          // Once we determine the messaging keys of the parties, we will then encrypt a message based on the keys.
          const callEncrypt$ = (encryptedMessagingKeyRandomness?: string) => {
            let payload = {
              ...this.identityService.identityServiceParamsForKey(
                SenderPublicKeyBase58Check
              ),
              recipientPublicKey:
                partyMessagingKeys.RecipientMessagingPublicKeyBase58Check,
              senderGroupKeyName: partyMessagingKeys.SenderMessagingKeyName,
              message: MessageText,
            };
            if (encryptedMessagingKeyRandomness) {
              payload = { ...payload, encryptedMessagingKeyRandomness };
            }
            return this.identityService.encrypt(payload);
          };

          const callRegisterGroupMessagingKey$ = (res: {
            messagingPublicKeyBase58Check: string;
            messagingKeySignature: string;
          }) => {
            return this.RegisterGroupMessagingKey(
              endpoint,
              SenderPublicKeyBase58Check,
              res.messagingPublicKeyBase58Check,
              'default-key',
              res.messagingKeySignature,
              [],
              {},
              MinFeeRateNanosPerKB
            );
          };

          const launchDefaultMessagingKey$ = () =>
            from(
              SwalHelper.fire({
                html: 'In order to use the latest messaging features, you need to create a default messaging key. DeSo Identity will now launch to generate this key for you.',
                showCancelButton: false,
              })
            ).pipe(
              switchMap((res) => {
                if (res.isConfirmed) {
                  return this.identityService
                    .launchDefaultMessagingKey(SenderPublicKeyBase58Check)
                    .pipe(timeout(45000));
                } else {
                  throwError(
                    'Default Messaging Key required to encrypt messages'
                  );
                }
              })
            );

          const submitEncryptedMessage$ = (encrypted: any) => {
            // Now we will use the ciphertext encrypted to user's messaging keys as part of the metadata of the
            // sendMessage transaction.
            const EncryptedMessageText = encrypted.encryptedMessage;
            // Determine whether to use V3 messaging group key names for sender or recipient.
            const senderV3 = partyMessagingKeys.IsSenderMessagingKey;
            const SenderMessagingGroupKeyName = senderV3
              ? partyMessagingKeys.SenderMessagingKeyName
              : '';
            const recipientV3 = partyMessagingKeys.IsRecipientMessagingKey;
            const RecipientMessagingGroupKeyName = recipientV3
              ? partyMessagingKeys.RecipientMessagingKeyName
              : '';
            return this.post(
              endpoint,
              BackendRoutes.RoutePathSendMessageStateless,
              {
                SenderPublicKeyBase58Check,
                RecipientPublicKeyBase58Check,
                EncryptedMessageText,
                SenderMessagingGroupKeyName,
                RecipientMessagingGroupKeyName,
                MinFeeRateNanosPerKB,
              }
            ).pipe(
              map((request) => {
                return { ...request };
              })
            );
          };
          // call encrypt and see what happens
          return callEncrypt$().pipe(
            switchMap((res: any) => {
              // Verify we have the messaging key
              return of({
                isMissingRandomness:
                  res?.encryptedMessage === '' &&
                  res?.requiresEncryptedMessagingKeyRandomness,
                res,
              });
            }),
            switchMap(({ isMissingRandomness, res }) => {
              if (!isMissingRandomness) {
                // easy pz return early
                return submitEncryptedMessage$(res);
              }
              // otherwise, launch
              return launchDefaultMessagingKey$().pipe(
                switchMap((res) => {
                  if (!res.encryptedMessagingKeyRandomness) {
                    return throwError(
                      'Error getting encrypted messaging key randomness'
                    );
                  }
                  this.SetEncryptedMessagingKeyRandomnessForPublicKey(
                    SenderPublicKeyBase58Check,
                    res.encryptedMessagingKeyRandomness
                  );
                  return this.GetDefaultKey(
                    endpoint,
                    SenderPublicKeyBase58Check
                  ).pipe(
                    switchMap((defaultKey) => {
                      return of({ defaultKey, res });
                    }),
                    switchMap(({ defaultKey, res }) => {
                      return !defaultKey
                        ? callRegisterGroupMessagingKey$(res).pipe(
                            switchMap((groupMessagingKeyResponse) => {
                              if (!groupMessagingKeyResponse) {
                                throwError('Error creating default key');
                              }
                              return of(res);
                            })
                          )
                        : of(res);
                    }),
                    switchMap((_) => {
                      partyMessagingKeys.SenderMessagingKeyName = 'default-key';
                      partyMessagingKeys.IsSenderMessagingKey = true;
                      return callEncrypt$().pipe(
                        switchMap((res) => {
                          if (
                            res?.encryptedMessage &&
                            !res?.requiresEncryptedMessagingKeyRandomness
                          ) {
                            return submitEncryptedMessage$(
                              res.encryptedMessage
                            );
                          }
                          return throwError('Error submitting messaging');
                        })
                      );
                    })
                  );
                })
              );
            })
          );
        })
      )
      .pipe(catchError(this._handleError));
    return this.signAndSubmitTransaction(
      endpoint,
      req,
      SenderPublicKeyBase58Check
    );
  }

  RegisterGroupMessagingKey(
    endpoint: string,
    OwnerPublicKeyBase58Check: string,
    MessagingPublicKeyBase58Check: string,
    MessagingGroupKeyName: string,
    MessagingKeySignatureHex: string,
    MessagingGroupMembers: MessagingGroupMemberResponse[],
    ExtraData: { [k: string]: string },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(
      endpoint,
      BackendRoutes.RegisterGroupMessagingKey,
      {
        OwnerPublicKeyBase58Check,
        MessagingPublicKeyBase58Check,
        MessagingGroupKeyName,
        MessagingKeySignatureHex,
        MessagingGroupMembers,
        ExtraData,
        MinFeeRateNanosPerKB,
      }
    );
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      OwnerPublicKeyBase58Check
    );
  }

  // User-related functions.
  GetUsersStateless(
    endpoint: string,
    PublicKeysBase58Check: string[],
    SkipForLeaderboard: boolean = false
  ): Observable<GetUsersStatelessResponse> {
    return this.post(endpoint, BackendRoutes.GetUsersStatelessRoute, {
      PublicKeysBase58Check,
      SkipForLeaderboard,
    });
  }

  getAllTransactionOutputs(tx: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // If the tx doesn't have more outputs then return.
      if (!tx.next_outputs || tx.outputs.length < 20) {
        resolve(tx);
        return;
      }

      // Else query the next_output and add the new outputs to the tx.
      // Do this recursively until everything has been fetched.
      this.httpClient
        .get<any>(tx.next_outputs + `&token=${this.blockCypherToken}`)
        .pipe(
          map((res) => {
            return res;
          }),
          catchError(this._handleError)
        )
        .subscribe(
          (res) => {
            // Add the next_outputs to the back of the txn
            if (res.outputs) {
              for (let ii = 0; ii < res.outputs.length; ii++) {
                tx.outputs.push(res.outputs[ii]);
              }
            }

            // If there are more outputs, then we do a dirty hack. We change
            // the next_outputs of the current txn to the next_outputs of the
            // response. Then call this function recursively to add the
            // remaining outputs.
            // BlockCypher also
            // doesn't tell us when a transaction is out of outputs, so we have
            // to assume it has more outputs if its at the maximum number of outputs,
            // which is 20 for BlockCypher.
            if (res.outputs.length >= 20) {
              tx.next_outputs = res.next_outputs;
              this.getAllTransactionOutputs(tx).then(
                (res) => {
                  resolve(res);
                },
                (err) => {
                  console.error(err);
                  resolve(tx);
                }
              );
            } else {
              resolve(tx);
            }
          },
          (err) => {
            console.error(err);
            resolve(err);
          }
        );
    });
  }

  GetBitcoinAPIInfo(bitcoinAddr: string, isTestnet: boolean): Observable<any> {
    let endpoint = `https://api.blockcypher.com/v1/btc/main/addrs/${bitcoinAddr}/full?token=${this.blockCypherToken}`;
    if (isTestnet) {
      endpoint = `https://api.blockcypher.com/v1/btc/test3/addrs/${bitcoinAddr}/full?token=${this.blockCypherToken}`;
    }

    return this.httpClient.get<any>(endpoint).pipe(
      map((res) => {
        // If the response has no transactions or if the final balance is zero
        // then just return it.
        if (!res.txs || !res.final_balance) {
          return new Promise((resolve, reject) => {
            resolve(res);
          });
        }

        // For each transaction, continuously fetch its outputs until we
        // run out of them.
        const txnPromises = [];
        // TODO: This causes us to hit rate limits if there are too many
        // transactions in the backlog. We should fix this at some point.
        for (let ii = 0; ii < res.txs.length; ii++) {
          txnPromises.push(this.getAllTransactionOutputs(res.txs[ii]));
        }

        return Promise.all(txnPromises).then((xxx) => res);
      }),
      catchError(this._handleError)
    );
  }

  UploadImage(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    file: File
  ): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(
        UserPublicKeyBase58Check
      ),
    });
    return request.pipe(
      switchMap((signed) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('UserPublicKeyBase58Check', UserPublicKeyBase58Check);
        formData.append('JWT', signed.jwt);

        return this.post(
          endpoint,
          BackendRoutes.RoutePathUploadImage,
          formData
        );
      })
    );
  }

  UploadVideo(
    endpoint: string,
    file: File,
    publicKeyBase58Check: string
  ): Observable<{
    tusEndpoint: string;
    asset: {
      id: string;
      playbackId: string;
    };
  }> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(publicKeyBase58Check),
    });
    return request.pipe(
      switchMap((signed) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('UserPublicKeyBase58Check', publicKeyBase58Check);
        formData.append('JWT', signed.jwt);

        return this.post(
          endpoint,
          BackendRoutes.RoutePathUploadVideo,
          formData
        );
      })
    );
  }

  CreateNft(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    NumCopies: number,
    NFTRoyaltyToCreatorBasisPoints: number,
    NFTRoyaltyToCoinBasisPoints: number,
    HasUnlockable: boolean,
    IsForSale: boolean,
    MinBidAmountNanos: number,
    IsBuyNow: boolean,
    BuyNowPriceNanos: number,
    AdditionalDESORoyaltiesMap: { [k: string]: number },
    AdditionalCoinRoyaltiesMap: { [k: string]: number },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCreateNft, {
      UpdaterPublicKeyBase58Check,
      NFTPostHashHex,
      NumCopies,
      NFTRoyaltyToCreatorBasisPoints,
      NFTRoyaltyToCoinBasisPoints,
      HasUnlockable,
      IsForSale,
      MinBidAmountNanos,
      IsBuyNow,
      BuyNowPriceNanos,
      AdditionalDESORoyaltiesMap,
      AdditionalCoinRoyaltiesMap,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  UpdateNFT(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    IsForSale: boolean,
    MinBidAmountNanos: number,
    IsBuyNow: boolean,
    BuyNowPriceNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathUpdateNFT, {
      UpdaterPublicKeyBase58Check,
      NFTPostHashHex,
      SerialNumber,
      IsForSale,
      MinBidAmountNanos,
      IsBuyNow,
      BuyNowPriceNanos,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  CreateNFTBid(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    BidAmountNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCreateNFTBid, {
      UpdaterPublicKeyBase58Check,
      NFTPostHashHex,
      SerialNumber,
      BidAmountNanos,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  AcceptNFTBid(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    BidderPublicKeyBase58Check: string,
    BidAmountNanos: number,
    UnencryptedUnlockableText: string,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    let request = UnencryptedUnlockableText
      ? this.identityService.encrypt({
          ...this.identityService.identityServiceParamsForKey(
            UpdaterPublicKeyBase58Check
          ),
          recipientPublicKey: BidderPublicKeyBase58Check,
          senderGroupKeyName: '',
          message: UnencryptedUnlockableText,
        })
      : of({ encryptedMessage: '' });
    request = request.pipe(
      switchMap((encrypted) => {
        const EncryptedMessageText = encrypted.encryptedMessage;
        return this.post(endpoint, BackendRoutes.RoutePathAcceptNFTBid, {
          UpdaterPublicKeyBase58Check,
          NFTPostHashHex,
          SerialNumber,
          BidderPublicKeyBase58Check,
          BidAmountNanos,
          EncryptedUnlockableText: EncryptedMessageText,
          MinFeeRateNanosPerKB,
        }).pipe(
          map((request) => {
            return { ...request };
          })
        );
      })
    );
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  TransferNFT(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    ReceiverPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    UnencryptedUnlockableText: string,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    let request = UnencryptedUnlockableText
      ? this.identityService.encrypt({
          ...this.identityService.identityServiceParamsForKey(
            SenderPublicKeyBase58Check
          ),
          recipientPublicKey: ReceiverPublicKeyBase58Check,
          senderGroupKeyName: '',
          message: UnencryptedUnlockableText,
        })
      : of({ encryptedMessage: '' });
    request = request.pipe(
      switchMap((encrypted) => {
        const EncryptedUnlockableText = encrypted.encryptedMessage;
        return this.post(endpoint, BackendRoutes.RoutePathTransferNFT, {
          SenderPublicKeyBase58Check,
          ReceiverPublicKeyBase58Check,
          NFTPostHashHex,
          SerialNumber,
          EncryptedUnlockableText,
          MinFeeRateNanosPerKB,
        }).pipe(
          map((request) => {
            return { ...request };
          })
        );
      })
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      SenderPublicKeyBase58Check
    );
  }

  AcceptNFTTransfer(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(
      endpoint,
      BackendRoutes.RoutePathAcceptNFTTransfer,
      {
        UpdaterPublicKeyBase58Check,
        NFTPostHashHex,
        SerialNumber,
        MinFeeRateNanosPerKB,
      }
    );
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  BurnNFT(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    NFTPostHashHex: string,
    SerialNumber: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathBurnNFT, {
      UpdaterPublicKeyBase58Check,
      NFTPostHashHex,
      SerialNumber,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  DecryptUnlockableTexts(
    ReaderPublicKeyBase58Check: string,
    UnlockableNFTEntryResponses: NFTEntryResponse[]
  ): Observable<any> {
    return this.identityService
      .decrypt({
        ...this.identityService.identityServiceParamsForKey(
          ReaderPublicKeyBase58Check
        ),
        encryptedMessages: UnlockableNFTEntryResponses.map(
          (unlockableNFTEntryResponses) => ({
            EncryptedHex: unlockableNFTEntryResponses.EncryptedUnlockableText,
            PublicKey:
              unlockableNFTEntryResponses.LastOwnerPublicKeyBase58Check,
          })
        ),
      })
      .pipe(
        map((decrypted) => {
          for (const unlockableNFTEntryResponse of UnlockableNFTEntryResponses) {
            unlockableNFTEntryResponse.DecryptedUnlockableText =
              decrypted.decryptedHexes[
                unlockableNFTEntryResponse.EncryptedUnlockableText
              ];
          }
          return UnlockableNFTEntryResponses;
        })
      )
      .pipe(catchError(this._handleError));
  }

  GetNFTBidsForNFTPost(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    PostHashHex: string
  ): Observable<NFTBidData> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNFTBidsForNFTPost, {
      ReaderPublicKeyBase58Check,
      PostHashHex,
    });
  }

  GetNFTsForUser(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    ReaderPublicKeyBase58Check: string,
    IsForSale: boolean | null = null,
    IsPending: boolean | null = null
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNFTsForUser, {
      UserPublicKeyBase58Check,
      ReaderPublicKeyBase58Check,
      IsForSale,
      IsPending,
    });
  }

  GetNFTBidsForUser(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNFTBidsForUser, {
      UserPublicKeyBase58Check,
      ReaderPublicKeyBase58Check,
    });
  }

  GetNFTShowcase(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNFTShowcase, {
      UserPublicKeyBase58Check,
      ReaderPublicKeyBase58Check,
    });
  }

  GetNextNFTShowcase(
    endpoint: string,
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNextNFTShowcase, {
      UserPublicKeyBase58Check,
    });
  }

  GetNFTCollectionSummary(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    PostHashHex: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNFTCollectionSummary, {
      ReaderPublicKeyBase58Check,
      PostHashHex,
    });
  }

  GetNFTEntriesForNFTPost(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    PostHashHex: string
  ): Observable<any> {
    return this.post(
      endpoint,
      BackendRoutes.RoutePathGetNFTEntriesForPostHash,
      {
        ReaderPublicKeyBase58Check,
        PostHashHex,
      }
    );
  }

  SubmitPost(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    PostHashHexToModify: string,
    ParentStakeID: string,
    Title: string,
    BodyObj: PostTxnBody,
    RepostedPostHashHex: string,
    PostExtraData: any,
    Sub: string,
    IsHidden: boolean,
    MinFeeRateNanosPerKB: number,
    InTutorial: boolean = false
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathSubmitPost, {
      UpdaterPublicKeyBase58Check,
      PostHashHexToModify,
      ParentStakeID,
      Title,
      BodyObj,
      RepostedPostHashHex,
      PostExtraData,
      Sub,
      IsHidden,
      MinFeeRateNanosPerKB,
      InTutorial,
    });

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  GetHotFeed(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    SeenPosts,
    ResponseLimit
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetHotFeed, {
      ReaderPublicKeyBase58Check,
      SeenPosts,
      ResponseLimit,
      SortByNew: false,
    });
  }

  GetPostsStateless(
    endpoint: string,
    PostHashHex: string,
    ReaderPublicKeyBase58Check: string,
    OrderBy: string,
    StartTstampSecs: number,
    PostContent: string,
    NumToFetch: number,
    FetchSubcomments: boolean,
    GetPostsForFollowFeed: boolean,
    GetPostsForGlobalWhitelist: boolean,
    GetPostsByDESO: boolean,
    MediaRequired: boolean,
    PostsByDESOMinutesLookback: number,
    AddGlobalFeedBool: boolean
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetPostsStateless, {
      PostHashHex,
      ReaderPublicKeyBase58Check,
      OrderBy,
      StartTstampSecs,
      PostContent,
      NumToFetch,
      FetchSubcomments,
      GetPostsForFollowFeed,
      GetPostsForGlobalWhitelist,
      GetPostsByDESO,
      MediaRequired,
      PostsByDESOMinutesLookback,
      AddGlobalFeedBool,
    });
  }

  GetSinglePost(
    endpoint: string,
    PostHashHex: string,
    ReaderPublicKeyBase58Check: string,
    FetchParents: boolean = true,
    CommentOffset: number = 0,
    CommentLimit: number = 20,
    AddGlobalFeedBool: boolean = false
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetSinglePost, {
      PostHashHex,
      ReaderPublicKeyBase58Check,
      FetchParents,
      CommentOffset,
      CommentLimit,
      AddGlobalFeedBool,
    });
  }

  GetProfiles(
    endpoint: string,
    PublicKeyBase58Check: string,
    Username: string,
    UsernamePrefix: string,
    Description: string,
    OrderBy: string,
    NumToFetch: number,
    ReaderPublicKeyBase58Check: string,
    ModerationType: string,
    FetchUsersThatHODL: boolean,
    AddGlobalFeedBool: boolean = false
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetProfiles, {
      PublicKeyBase58Check,
      Username,
      UsernamePrefix,
      Description,
      OrderBy,
      NumToFetch,
      ReaderPublicKeyBase58Check,
      ModerationType,
      FetchUsersThatHODL,
      AddGlobalFeedBool,
    });
  }
  GetSingleProfile(
    endpoint: string,
    PublicKeyBase58Check: string,
    Username: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetSingleProfile, {
      PublicKeyBase58Check,
      Username,
    });
  }

  // We add a ts-ignore here as typescript does not expect responseType to be anything but "json".
  GetSingleProfilePicture(
    endpoint: string,
    PublicKeyBase58Check: string,
    bustCache: string = ''
  ): Observable<any> {
    return this.httpClient.get<any>(
      this.GetSingleProfilePictureURL(
        endpoint,
        PublicKeyBase58Check,
        bustCache
      ),
      {
        // @ts-ignore
        responseType: 'blob',
      }
    );
  }
  GetSingleProfilePictureURL(
    endpoint: string,
    PublicKeyBase58Check: string,
    fallback
  ): string {
    return this._makeRequestURL(
      endpoint,
      BackendRoutes.RoutePathGetSingleProfilePicture +
        '/' +
        PublicKeyBase58Check +
        '?' +
        fallback
    );
  }
  GetDefaultProfilePictureURL(endpoint: string): string {
    return this._makeRequestURL(
      endpoint,
      '/assets/img/default_profile_pic.png'
    );
  }

  GetPostsForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    Username: string,
    ReaderPublicKeyBase58Check: string,
    LastPostHashHex: string,
    NumToFetch: number,
    MediaRequired: boolean,
    IncludeComments: boolean = false
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetPostsForPublicKey, {
      PublicKeyBase58Check,
      Username,
      ReaderPublicKeyBase58Check,
      LastPostHashHex,
      NumToFetch,
      MediaRequired,
      IncludeComments
    });
  }

  GetDiamondedPosts(
    endpoint: string,
    ReceiverPublicKeyBase58Check: string,
    ReceiverUsername: string,
    SenderPublicKeyBase58Check: string,
    SenderUsername: string,
    ReaderPublicKeyBase58Check: string,
    StartPostHashHex: string,
    NumToFetch: number
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetDiamondedPosts, {
      ReceiverPublicKeyBase58Check,
      ReceiverUsername,
      SenderPublicKeyBase58Check,
      SenderUsername,
      ReaderPublicKeyBase58Check,
      StartPostHashHex,
      NumToFetch,
    });
  }

  GetHodlersForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    Username: string,
    LastPublicKeyBase58Check: string,
    NumToFetch: number,
    FetchHodlings: boolean = false,
    FetchAll: boolean = false,
    IsDAOCoin: boolean = false
  ): Observable<{
    Hodlers: BalanceEntryResponse[];
    LastPublicKeyBase58Check: string;
  }> {
    return this.post(endpoint, BackendRoutes.RoutePathGetHodlersForPublicKey, {
      PublicKeyBase58Check,
      Username,
      LastPublicKeyBase58Check,
      NumToFetch,
      FetchHodlings,
      FetchAll,
      IsDAOCoin,
    });
  }

  IsHodlingPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    IsHodlingPublicKeyBase58Check: string,
    IsDAOCoin: boolean
  ): Observable<{ IsHodling: boolean; BalanceEntry: BalanceEntryResponse }> {
    return this.post(endpoint, BackendRoutes.RoutePathIsHodlingPublicKey, {
      PublicKeyBase58Check,
      IsHodlingPublicKeyBase58Check,
      IsDAOCoin,
    });
  }

  UpdateProfile(
    endpoint: string,
    // Specific fields
    UpdaterPublicKeyBase58Check: string,
    // Optional: Only needed when updater public key != profile public key
    ProfilePublicKeyBase58Check: string,
    NewUsername: string,
    NewDescription: string,
    NewProfilePic: string,
    NewCreatorBasisPoints: number,
    NewStakeMultipleBasisPoints: number,
    IsHidden: boolean,
    // End specific fields
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    NewCreatorBasisPoints = Math.floor(NewCreatorBasisPoints);
    NewStakeMultipleBasisPoints = Math.floor(NewStakeMultipleBasisPoints);

    const request = this.post(endpoint, BackendRoutes.RoutePathUpdateProfile, {
      UpdaterPublicKeyBase58Check,
      ProfilePublicKeyBase58Check,
      NewUsername,
      NewDescription,
      NewProfilePic,
      NewCreatorBasisPoints,
      NewStakeMultipleBasisPoints,
      IsHidden,
      MinFeeRateNanosPerKB,
    }).pipe(
      switchMap((res) => {
        // We need to wait until the profile creation has been comped.
        if (res.CompProfileCreationTxnHashHex) {
          return interval(500)
            .pipe(
              concatMap((iteration) =>
                zip(
                  this.GetTxn(endpoint, res.CompProfileCreationTxnHashHex),
                  of(iteration)
                )
              )
            )
            .pipe(
              filter(
                ([txFound, iteration]) => txFound.TxnFound || iteration > 120
              )
            )
            .pipe(take(1))
            .pipe(switchMap(() => of(res)));
        } else {
          return of(res);
        }
      })
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  GetFollows(
    endpoint: string,
    Username: string,
    PublicKeyBase58Check: string,
    GetEntriesFollowingUsername: boolean,
    LastPublicKeyBase58Check: string = '',
    NumToFetch: number = 50
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetFollowsStateless, {
      Username,
      PublicKeyBase58Check,
      GetEntriesFollowingUsername,
      LastPublicKeyBase58Check,
      NumToFetch,
    });
  }

  CreateFollowTxn(
    endpoint: string,
    FollowerPublicKeyBase58Check: string,
    FollowedPublicKeyBase58Check: string,
    IsUnfollow: boolean,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(
      endpoint,
      BackendRoutes.RoutePathCreateFollowTxnStateless,
      {
        FollowerPublicKeyBase58Check,
        FollowedPublicKeyBase58Check,
        IsUnfollow,
        MinFeeRateNanosPerKB,
      }
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      FollowerPublicKeyBase58Check
    );
  }

  GetMessages(
    endpoint: string,
    PublicKeyBase58Check: string,
    FetchAfterPublicKeyBase58Check: string = '',
    NumToFetch: number = 25,
    HoldersOnly: boolean = false,
    HoldingsOnly: boolean = false,
    FollowersOnly: boolean = false,
    FollowingOnly: boolean = false,
    SortAlgorithm: string = 'time',
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    let req = this.httpClient.post<any>(
      this._makeRequestURL(
        endpoint,
        BackendRoutes.RoutePathGetMessagesStateless
      ),
      {
        PublicKeyBase58Check,
        FetchAfterPublicKeyBase58Check,
        NumToFetch,
        HoldersOnly,
        HoldingsOnly,
        FollowersOnly,
        FollowingOnly,
        SortAlgorithm,
      }
    );
    // create an array of messages to decrypt
    req = req.pipe(
      map((res) => {
        // This array contains encrypted messages with public keys
        // Public keys of the other party involved in the correspondence
        const encryptedMessages = res.OrderedContactsWithMessages.flatMap(
          (thread) =>
            thread.Messages.flatMap((message) => ({
              EncryptedHex: message.EncryptedText,
              PublicKey: message.IsSender
                ? message.RecipientPublicKeyBase58Check
                : message.SenderPublicKeyBase58Check,
              IsSender: message.IsSender,
              Legacy: !message.V2 && (!message.Version || message.Version < 2),
              Version: message.Version,
              SenderMessagingPublicKey: message.SenderMessagingPublicKey,
              SenderMessagingGroupKeyName: message.SenderMessagingGroupKeyName,
              RecipientMessagingPublicKey: message.RecipientMessagingPublicKey,
              RecipientMessagingGroupKeyName:
                message.RecipientMessagingGroupKeyName,
            }))
        );
        return { ...res, encryptedMessages };
      })
    );
    const launchDefaultMessagingKey$ = () =>
      from(
        SwalHelper.fire({
          html: 'In order to use the latest messaging features, you need to create a default messaging key. DeSo Identity will now launch to generate this key for you.',
          showCancelButton: false,
        })
      ).pipe(
        switchMap((res) => {
          if (res.isConfirmed) {
            return this.identityService
              .launchDefaultMessagingKey(PublicKeyBase58Check)
              .pipe(timeout(45000));
          } else {
            throwError('Default Messaging Key required to encrypt messages');
          }
        })
      );

    const callRegisterGroupMessagingKey$ = (res: {
      messagingPublicKeyBase58Check: string;
      messagingKeySignature: string;
    }) => {
      return this.RegisterGroupMessagingKey(
        endpoint,
        PublicKeyBase58Check,
        res.messagingPublicKeyBase58Check,
        'default-key',
        res.messagingKeySignature,
        [],
        {},
        MinFeeRateNanosPerKB
      );
    };

    const addDecryptedMessagesToMessagePayload = (
      res,
      decryptedHexes,
      wrap
    ) => {
      res.OrderedContactsWithMessages.forEach((threads) =>
        threads.Messages.forEach((message) => {
          message.DecryptedText =
            decryptedHexes.decryptedHexes[message.EncryptedText];
        })
      );
      return wrap
        ? of({ ...res, ...decryptedHexes })
        : { ...res, ...decryptedHexes };
    };

    // decrypt all the messages
    req = req
      .pipe(
        switchMap((res) => {
          return this.identityService
            .decrypt({
              ...this.identityService.identityServiceParamsForKey(
                PublicKeyBase58Check
              ),
              encryptedMessages: res.encryptedMessages,
              // encryptedMessagingKeyRandomness: undefined, // useful for testing with key / without key flows
            })
            .pipe(
              map((decryptedResponse) => {
                if (
                  decryptedResponse?.requiresEncryptedMessagingKeyRandomness ===
                  true
                ) {
                  // go get the key
                  return launchDefaultMessagingKey$().pipe(
                    switchMap((defaultMessagingKeyResponse) => {
                      if (
                        defaultMessagingKeyResponse.encryptedMessagingKeyRandomness
                      ) {
                        this.SetEncryptedMessagingKeyRandomnessForPublicKey(
                          PublicKeyBase58Check,
                          defaultMessagingKeyResponse.encryptedMessagingKeyRandomness
                        );
                        return this.GetDefaultKey(
                          endpoint,
                          PublicKeyBase58Check
                        ).pipe(
                          switchMap((defaultKey) => {
                            return of({
                              defaultKey,
                              defaultMessagingKeyResponse,
                            });
                          }),
                          switchMap(
                            ({ defaultKey, defaultMessagingKeyResponse }) => {
                              return !defaultKey
                                ? callRegisterGroupMessagingKey$(
                                    defaultMessagingKeyResponse
                                  ).pipe(
                                    switchMap((groupMessagingKeyResponse) => {
                                      if (!groupMessagingKeyResponse) {
                                        throwError(
                                          'Error creating default key'
                                        );
                                      }
                                      return of(defaultMessagingKeyResponse);
                                    })
                                  )
                                : of(defaultMessagingKeyResponse);
                            }
                          ),
                          switchMap((_) => {
                            return this.identityService
                              .decrypt({
                                ...this.identityService.identityServiceParamsForKey(
                                  PublicKeyBase58Check
                                ),
                                encryptedMessages: res.encryptedMessages,

                                encryptedMessagingKeyRandomness:
                                  defaultMessagingKeyResponse.encryptedMessagingKeyRandomness,
                              })
                              .pipe(
                                map((decryptedHexes) =>
                                  addDecryptedMessagesToMessagePayload(
                                    res,
                                    decryptedHexes,
                                    false
                                  )
                                )
                              );
                          })
                        );
                      }
                    })
                  );
                } else if (decryptedResponse.decryptedHexes) {
                  return addDecryptedMessagesToMessagePayload(
                    res,
                    decryptedResponse,
                    true
                  );
                } else {
                  throw 'something went wrong with decrypting';
                }
              })
            );
        })
      )
      .pipe(
        switchMap((t) => {
          return t;
        })
      );
    return req.pipe(catchError(this._handleError));
  }

  GetAllMessagingGroupKeys(
    endpoint: string,
    OwnerPublicKeyBase58Check: string
  ): Observable<GetAllMessagingGroupKeysResponse> {
    return this.post(endpoint, BackendRoutes.GetAllMessagingGroupKeys, {
      OwnerPublicKeyBase58Check,
    });
  }

  GetDefaultKey(
    endpoint: string,
    publicKeyBase58Check: string
  ): Observable<MessagingGroupEntryResponse | null> {
    return this.GetAllMessagingGroupKeys(endpoint, publicKeyBase58Check).pipe(
      map((res) => {
        const defaultKeys = res.MessagingGroupEntries.filter(
          (messagingGroup: MessagingGroupEntryResponse) => {
            return messagingGroup.MessagingGroupKeyName === 'default-key';
          }
        );
        return defaultKeys.length ? defaultKeys[0] : null;
      })
    );
  }

  CreateLike(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    LikedPostHashHex: string,
    IsUnlike: boolean,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(
      endpoint,
      BackendRoutes.RoutePathCreateLikeStateless,
      {
        ReaderPublicKeyBase58Check,
        LikedPostHashHex,
        IsUnlike,
        MinFeeRateNanosPerKB,
      }
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      ReaderPublicKeyBase58Check
    );
  }

  SendDiamonds(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    ReceiverPublicKeyBase58Check: string,
    DiamondPostHashHex: string,
    DiamondLevel: number,
    MinFeeRateNanosPerKB: number,
    InTutorial: boolean = false
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathSendDiamonds, {
      SenderPublicKeyBase58Check,
      ReceiverPublicKeyBase58Check,
      DiamondPostHashHex,
      DiamondLevel,
      MinFeeRateNanosPerKB,
      InTutorial,
    });

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      SenderPublicKeyBase58Check
    );
  }

  GetDiamondsForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    FetchYouDiamonded: boolean = false
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetDiamondsForPublicKey, {
      PublicKeyBase58Check,
      FetchYouDiamonded,
    });
  }

  GetLikesForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetLikesForPost, {
      PostHashHex,
      Offset,
      Limit,
      ReaderPublicKeyBase58Check,
    });
  }

  GetDiamondsForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetDiamondsForPost, {
      PostHashHex,
      Offset,
      Limit,
      ReaderPublicKeyBase58Check,
    });
  }

  GetRepostsForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetRepostsForPost, {
      PostHashHex,
      Offset,
      Limit,
      ReaderPublicKeyBase58Check,
    });
  }

  GetQuoteRepostsForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetQuoteRepostsForPost, {
      PostHashHex,
      Offset,
      Limit,
      ReaderPublicKeyBase58Check,
    });
  }

  BuyOrSellCreatorCoin(
    endpoint: string,

    // The public key of the user who is making the buy/sell.
    UpdaterPublicKeyBase58Check: string,
    // The public key of the profile that the purchaser is trying
    // to buy.
    CreatorPublicKeyBase58Check: string,
    // Whether this is a "buy" or "sell"
    OperationType: string,
    // Generally, only one of these will be used depending on the OperationType
    // set. In a Buy transaction, DeSoToSellNanos will be converted into
    // creator coin on behalf of the user. In a Sell transaction,
    // CreatorCoinToSellNanos will be converted into DeSo. In an AddDeSo
    // operation, DeSoToAddNanos will be aded for the user. This allows us to
    // support multiple transaction types with same meta field.
    DeSoToSellNanos: number,
    CreatorCoinToSellNanos: number,
    DeSoToAddNanos: number,
    // When a user converts DeSo into CreatorCoin, MinCreatorCoinExpectedNanos
    // specifies the minimum amount of creator coin that the user expects from their
    // transaction. And vice versa when a user is converting CreatorCoin for DeSo.
    // Specifying these fields prevents the front-running of users' buy/sell. Setting
    // them to zero turns off the check. Give it your best shot, Ivan.
    MinDeSoExpectedNanos: number,
    MinCreatorCoinExpectedNanos: number,

    MinFeeRateNanosPerKB: number,
    Broadcast: boolean,
    InTutorial: boolean = false
  ): Observable<any> {
    DeSoToSellNanos = Math.floor(DeSoToSellNanos);
    CreatorCoinToSellNanos = Math.floor(CreatorCoinToSellNanos);
    DeSoToAddNanos = Math.floor(DeSoToAddNanos);
    MinDeSoExpectedNanos = Math.floor(MinDeSoExpectedNanos);
    MinCreatorCoinExpectedNanos = Math.floor(MinCreatorCoinExpectedNanos);

    let request = this.post(
      endpoint,
      BackendRoutes.RoutePathBuyOrSellCreatorCoin,
      {
        UpdaterPublicKeyBase58Check,
        CreatorPublicKeyBase58Check,
        OperationType,
        DeSoToSellNanos,
        CreatorCoinToSellNanos,
        DeSoToAddNanos,
        MinDeSoExpectedNanos,
        MinCreatorCoinExpectedNanos,
        MinFeeRateNanosPerKB,
        // If we are not broadcasting the transaction, InTutorial should always be false so we don't update the TutorialStatus of the user.
        InTutorial: Broadcast ? InTutorial : false,
      }
    );

    if (Broadcast) {
      request = this.signAndSubmitTransaction(
        endpoint,
        request,
        UpdaterPublicKeyBase58Check
      );
    }

    return request;
  }

  TransferCreatorCoin(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    CreatorPublicKeyBase58Check: string,
    ReceiverUsernameOrPublicKeyBase58Check: string,
    CreatorCoinToTransferNanos: number,
    MinFeeRateNanosPerKB: number,
    Broadcast: boolean
  ): Observable<any> {
    CreatorCoinToTransferNanos = Math.floor(CreatorCoinToTransferNanos);

    const routeName = BackendRoutes.RoutePathTransferCreatorCoin;
    let request = this.post(endpoint, routeName, {
      SenderPublicKeyBase58Check,
      CreatorPublicKeyBase58Check,
      ReceiverUsernameOrPublicKeyBase58Check,
      CreatorCoinToTransferNanos,
      MinFeeRateNanosPerKB,
    });

    if (Broadcast) {
      request = this.signAndSubmitTransaction(
        endpoint,
        request,
        SenderPublicKeyBase58Check
      );
    }

    return request;
  }

  DAOCoin(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    ProfilePublicKeyBase58CheckOrUsername: string,
    OperationType: DAOCoinOperationTypeString,
    TransferRestrictionStatus: TransferRestrictionStatusString | undefined,
    CoinsToMintNanos: Hex | undefined,
    CoinsToBurnNanos: Hex | undefined,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathDAOCoin, {
      UpdaterPublicKeyBase58Check,
      ProfilePublicKeyBase58CheckOrUsername,
      OperationType,
      CoinsToMintNanos,
      CoinsToBurnNanos,
      TransferRestrictionStatus,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  TransferDAOCoin(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    ProfilePublicKeyBase58CheckOrUsername: string,
    ReceiverPublicKeyBase58CheckOrUsername: string,
    DAOCoinToTransferNanos: Hex,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(
      endpoint,
      BackendRoutes.RoutePathTransferDAOCoin,
      {
        SenderPublicKeyBase58Check,
        ProfilePublicKeyBase58CheckOrUsername,
        ReceiverPublicKeyBase58CheckOrUsername,
        DAOCoinToTransferNanos,
        MinFeeRateNanosPerKB,
      }
    );
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      SenderPublicKeyBase58Check
    );
  }

  BlockPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    BlockPublicKeyBase58Check: string,
    Unblock: boolean = false
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathBlockPublicKey,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
        BlockPublicKeyBase58Check,
        Unblock,
      }
    );
  }

  MarkContactMessagesRead(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    ContactPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathMarkContactMessagesRead,
      UserPublicKeyBase58Check,
      {
        UserPublicKeyBase58Check,
        ContactPublicKeyBase58Check,
      }
    );
  }

  MarkAllMessagesRead(
    endpoint: string,
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathMarkAllMessagesRead,
      UserPublicKeyBase58Check,
      {
        UserPublicKeyBase58Check,
      }
    );
  }

  // Note that FetchStartIndex < 0 means "fetch me the latest notifications."
  // To implement pagination, all you have to do
  // is set FetchStartIndex to the Index value of the last notification in
  // the list and re-fetch. The endpoint will return NumToFetch notifications
  // that include all notifications that are currently in the mempool.
  GetNotifications(
    endpoint: string,
    PublicKeyBase58Check: string,
    FetchStartIndex: number,
    NumToFetch: number
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetNotifications, {
      PublicKeyBase58Check,
      FetchStartIndex,
      NumToFetch,
    });
  }

  GetAppState(endpoint: string, PublicKeyBase58Check: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetAppState, {
      PublicKeyBase58Check,
    });
  }

  UpdateUserGlobalMetadata(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    Email: string,
    MessageReadStateUpdatesByContact: any
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathUpdateUserGlobalMetadata,
      UserPublicKeyBase58Check,
      {
        UserPublicKeyBase58Check,
        Email,
        MessageReadStateUpdatesByContact,
      }
    );
  }

  GetUserGlobalMetadata(
    endpoint: string,

    // The public key of the user to update.
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathGetUserGlobalMetadata,
      UserPublicKeyBase58Check,
      {
        UserPublicKeyBase58Check,
      }
    );
  }

  ResendVerifyEmail(endpoint: string, PublicKey: string) {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathResendVerifyEmail,
      PublicKey,
      {
        PublicKey,
      }
    );
  }

  VerifyEmail(
    endpoint: string,
    PublicKey: string,
    EmailHash: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathVerifyEmail, {
      PublicKey,
      EmailHash,
    });
  }

  DeletePII(endpoint: string, PublicKeyBase58Check: string): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathDeletePII,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
      }
    );
  }

  GetUserMetadata(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<GetUserMetadataResponse> {
    return this.get(
      endpoint,
      BackendRoutes.RoutePathGetUserMetadata + '/' + PublicKeyBase58Check
    );
  }

  GetUsernameForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<string> {
    return this.get(
      endpoint,
      BackendRoutes.RoutePathGetUsernameForPublicKey +
        '/' +
        PublicKeyBase58Check
    );
  }

  GetPublicKeyForUsername(
    endpoint: string,
    Username: string
  ): Observable<string> {
    return this.get(
      endpoint,
      BackendRoutes.RoutePathGetPublicKeyForUsername + '/' + Username
    );
  }

  GetJumioStatusForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathGetJumioStatusForPublicKey,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
      }
    );
  }

  SubmitETHTx(
    endpoint: string,
    PublicKeyBase58Check: string,
    Tx: any,
    ToSign: string[],
    SignedHashes: string[]
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathSubmitETHTx, {
      PublicKeyBase58Check,
      Tx,
      ToSign,
      SignedHashes,
    });
  }

  QueryETHRPC(
    endpoint: string,
    Method: string,
    Params: string[]
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathQueryETHRPC, {
      Method,
      Params,
    });
  }

  AdminGetVerifiedUsers(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetVerifiedUsers,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminGetUsernameVerificationAuditLogs(
    endpoint: string,
    AdminPublicKey: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetUsernameVerificationAuditLogs,
      AdminPublicKey,
      {
        AdminPublicKey,
        Username,
      }
    );
  }

  AdminGrantVerificationBadge(
    endpoint: string,
    AdminPublicKey: string,
    UsernameToVerify: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGrantVerificationBadge,
      AdminPublicKey,
      {
        AdminPublicKey,
        UsernameToVerify,
      }
    );
  }

  AdminRemoveVerificationBadge(
    endpoint: string,
    AdminPublicKey: string,
    UsernameForWhomToRemoveVerification: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminRemoveVerificationBadge,
      AdminPublicKey,
      {
        AdminPublicKey,
        UsernameForWhomToRemoveVerification,
      }
    );
  }

  AdminGetUserAdminData(
    endpoint: string,
    AdminPublicKey: string,
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetUserAdminData,
      AdminPublicKey,
      {
        AdminPublicKey,
        UserPublicKeyBase58Check,
      }
    );
  }

  NodeControl(
    endpoint: string,
    AdminPublicKey: string,
    Address: string,
    OperationType: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.NodeControlRoute,
      AdminPublicKey,
      {
        AdminPublicKey,
        Address,
        OperationType,
      }
    );
  }

  UpdateMiner(
    endpoint: string,
    AdminPublicKey: string,
    MinerPublicKeys: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.NodeControlRoute,
      AdminPublicKey,
      {
        AdminPublicKey,
        MinerPublicKeys,
        OperationType: 'update_miner',
      }
    );
  }

  AdminGetUserGlobalMetadata(
    endpoint: string,
    AdminPublicKey: string,

    // The public key of the user for whom we'd like to get global metadata
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetUserGlobalMetadata,
      AdminPublicKey,
      {
        AdminPublicKey,
        UserPublicKeyBase58Check,
      }
    );
  }

  AdminUpdateUserGlobalMetadata(
    endpoint: string,
    AdminPublicKey: string,

    // The public key of the user to update.
    UserPublicKeyBase58Check: string,
    Username: string,
    IsBlacklistUpdate: boolean,
    RemoveEverywhere: boolean,
    RemoveFromLeaderboard: boolean,
    IsWhitelistUpdate: boolean,
    WhitelistPosts: boolean,
    RemovePhoneNumberMetadata: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateUserGlobalMetadata,
      AdminPublicKey,
      {
        UserPublicKeyBase58Check,
        Username,
        IsBlacklistUpdate,
        RemoveEverywhere,
        RemoveFromLeaderboard,
        IsWhitelistUpdate,
        WhitelistPosts,
        RemovePhoneNumberMetadata,
        AdminPublicKey,
      }
    );
  }

  AdminUpdateUsernameBlacklist(
    endpoint: string,
    AdminPublicKey: string,

    Username: string,
    IsBlacklistUpdate: boolean,
    AddUserToList: boolean,
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateUsernameBlacklist,
      AdminPublicKey,
      {
        Username,
        IsBlacklistUpdate,
        AddUserToList,
        AdminPublicKey,
      }
    );
  }

  AdminResetPhoneNumber(
    endpoint: string,
    AdminPublicKey: string,
    PhoneNumber: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminResetPhoneNumber,
      AdminPublicKey,
      {
        PhoneNumber,
        AdminPublicKey,
      }
    );
  }

  AdminGetAllUserGlobalMetadata(
    endpoint: string,
    AdminPublicKey: string,
    NumToFetch: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetAllUserGlobalMetadata,
      AdminPublicKey,
      {
        AdminPublicKey,
        NumToFetch,
      }
    );
  }

  AdminPinPost(
    endpoint: string,
    AdminPublicKey: string,
    PostHashHex: string,
    UnpinPost: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminPinPost,
      AdminPublicKey,
      {
        AdminPublicKey,
        PostHashHex,
        UnpinPost,
      }
    );
  }

  AdminUpdateGlobalFeed(
    endpoint: string,
    AdminPublicKey: string,
    PostHashHex: string,
    RemoveFromGlobalFeed: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateGlobalFeed,
      AdminPublicKey,
      {
        AdminPublicKey,
        PostHashHex,
        RemoveFromGlobalFeed,
      }
    );
  }

  AdminRemoveNilPosts(
    endpoint: string,
    AdminPublicKey: string,
    NumPostsToSearch: number = 1000
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminRemoveNilPosts,
      AdminPublicKey,
      {
        AdminPublicKey,
        NumPostsToSearch,
      }
    );
  }

  AdminReprocessBitcoinBlock(
    endpoint: string,
    AdminPublicKey: string,
    blockHashOrBlockHeight: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      `${BackendRoutes.ReprocessBitcoinBlockRoute}/${blockHashOrBlockHeight}`,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminGetMempoolStats(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetMempoolStats,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminGetUnfilteredHotFeed(
    endpoint: string,
    AdminPublicKey: string,
    ResponseLimit: number,
    SeenPosts: Array<string>
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetUnfilteredHotFeed,
      AdminPublicKey,
      {
        AdminPublicKey,
        ResponseLimit,
        SeenPosts,
      }
    );
  }

  AdminGetHotFeedAlgorithm(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetHotFeedAlgorithm,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminUpdateHotFeedAlgorithm(
    endpoint: string,
    AdminPublicKey: string,
    InteractionCap: number,
    InteractionCapTag: number,
    TimeDecayBlocks: number,
    TimeDecayBlocksTag: number,
    TxnTypeMultiplierMap: { [txnType: number]: number }
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateHotFeedAlgorithm,
      AdminPublicKey,
      {
        AdminPublicKey,
        InteractionCap,
        InteractionCapTag,
        TimeDecayBlocks,
        TimeDecayBlocksTag,
        TxnTypeMultiplierMap,
      }
    );
  }

  AdminUpdateHotFeedPostMultiplier(
    endpoint: string,
    AdminPublicKey: string,
    PostHashHex: string,
    Multiplier: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateHotFeedPostMultiplier,
      AdminPublicKey,
      {
        AdminPublicKey,
        PostHashHex,
        Multiplier,
      }
    );
  }

  AdminUpdateHotFeedUserMultiplier(
    endpoint: string,
    AdminPublicKey: string,
    Username: string,
    InteractionMultiplier: number,
    PostsMultiplier: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateHotFeedUserMultiplier,
      AdminPublicKey,
      {
        AdminPublicKey,
        Username,
        InteractionMultiplier,
        PostsMultiplier,
      }
    );
  }

  AdminGetHotFeedUserMultiplier(
    endpoint: string,
    AdminPublicKey: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetHotFeedUserMultiplier,
      AdminPublicKey,
      {
        AdminPublicKey,
        Username,
      }
    );
  }

  SwapIdentity(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    FromUsernameOrPublicKeyBase58Check: string,
    ToUsernameOrPublicKeyBase58Check: string,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathSwapIdentity,
      UpdaterPublicKeyBase58Check,
      {
        UpdaterPublicKeyBase58Check,
        FromUsernameOrPublicKeyBase58Check,
        ToUsernameOrPublicKeyBase58Check,
        MinFeeRateNanosPerKB,
        AdminPublicKey: UpdaterPublicKeyBase58Check,
      }
    );

    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  SetUSDCentsToDeSoReserveExchangeRate(
    endpoint: string,
    AdminPublicKey: string,
    USDCentsPerDeSo: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathSetUSDCentsToDeSoReserveExchangeRate,
      AdminPublicKey,
      {
        AdminPublicKey,
        USDCentsPerDeSo,
      }
    );
  }

  GetUSDCentsToDeSoReserveExchangeRate(endpoint: string): Observable<any> {
    return this.get(
      endpoint,
      BackendRoutes.RoutePathGetUSDCentsToDeSoReserveExchangeRate
    );
  }

  SetBuyDeSoFeeBasisPoints(
    endpoint: string,
    AdminPublicKey: string,
    BuyDeSoFeeBasisPoints: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathSetBuyDeSoFeeBasisPoints,
      AdminPublicKey,
      {
        AdminPublicKey,
        BuyDeSoFeeBasisPoints,
      }
    );
  }

  GetBuyDeSoFeeBasisPoints(endpoint: string): Observable<any> {
    return this.get(endpoint, BackendRoutes.RoutePathGetBuyDeSoFeeBasisPoints);
  }

  UpdateCaptchaRewardNanos(
    endpoint: string,
    AdminPublicKey: string,
    RewardNanos: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminSetCaptchaRewardNanos,
      AdminPublicKey,
      {
        AdminPublicKey,
        RewardNanos,
      }
    );
  }

  UpdateGlobalParams(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    USDCentsPerBitcoin: number,
    CreateProfileFeeNanos: number,
    MinimumNetworkFeeNanosPerKB: number,
    MaxCopiesPerNFT: number,
    CreateNFTFeeNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathUpdateGlobalParams,
      UpdaterPublicKeyBase58Check,
      {
        UpdaterPublicKeyBase58Check,
        USDCentsPerBitcoin,
        CreateProfileFeeNanos,
        MaxCopiesPerNFT,
        CreateNFTFeeNanos,
        MinimumNetworkFeeNanosPerKB,
        MinFeeRateNanosPerKB,
        AdminPublicKey: UpdaterPublicKeyBase58Check,
      }
    );
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      UpdaterPublicKeyBase58Check
    );
  }

  GetGlobalParams(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetGlobalParams, {
      UpdaterPublicKeyBase58Check,
    });
  }

  AdminGetNFTDrop(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    DropNumber: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetNFTDrop,
      UpdaterPublicKeyBase58Check,
      {
        DropNumber,
        AdminPublicKey: UpdaterPublicKeyBase58Check,
      }
    );
  }

  AdminUpdateNFTDrop(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    DropNumber: number,
    DropTstampNanos: number,
    IsActive: boolean,
    NFTHashHexToAdd: string,
    NFTHashHexToRemove: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateNFTDrop,
      UpdaterPublicKeyBase58Check,
      {
        DropNumber,
        DropTstampNanos,
        IsActive,
        NFTHashHexToAdd,
        NFTHashHexToRemove,
        AdminPublicKey: UpdaterPublicKeyBase58Check,
      }
    );
  }

  EvictUnminedBitcoinTxns(
    endpoint: string,
    UpdaterPublicKeyBase58Check,
    BitcoinTxnHashes: string[],
    DryRun: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathEvictUnminedBitcoinTxns,
      UpdaterPublicKeyBase58Check,
      {
        BitcoinTxnHashes,
        DryRun,
        AdminPublicKey: UpdaterPublicKeyBase58Check,
      }
    );
  }

  GetFullTikTokURL(
    endpoint: string,
    TikTokShortVideoID: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetFullTikTokURL, {
      TikTokShortVideoID,
    }).pipe(
      map((res) => {
        return res.FullTikTokURL;
      })
    );
  }

  AdminResetJumioAttemptsForPublicKey(
    endpoint: string,
    AdminPublicKey: string,
    PublicKeyBase58Check: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminResetJumioForPublicKey,
      AdminPublicKey,
      {
        AdminPublicKey,
        PublicKeyBase58Check,
        Username,
      }
    );
  }

  AdminUpdateJumioDeSo(
    endpoint: string,
    AdminPublicKey: string,
    DeSoNanos: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateJumioDeSo,
      AdminPublicKey,
      {
        DeSoNanos,
        AdminPublicKey,
      }
    );
  }

  AdminUpdateJumioUSDCents(
    endpoint: string,
    AdminPublicKey: string,
    USDCents: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateJumioUSDCents,
      AdminPublicKey,
      {
        AdminPublicKey,
        USDCents,
      }
    );
  }

  AdminUpdateJumioKickbackUSDCents(
    endpoint: string,
    AdminPublicKey: string,
    USDCents: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateJumioKickbackUSDCents,
      AdminPublicKey,
      {
        AdminPublicKey,
        USDCents,
      }
    );
  }

  AdminJumioCallback(
    endpoint: string,
    AdminPublicKey: string,
    PublicKeyBase58Check: string,
    Username: string,
    CountryAlpha3: string = ''
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminJumioCallback,
      AdminPublicKey,
      {
        PublicKeyBase58Check,
        Username,
        AdminPublicKey,
        CountryAlpha3,
      }
    );
  }

  AdminGetAllCountryLevelSignUpBonuses(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<{
    SignUpBonusMetadata: { [k: string]: CountryLevelSignUpBonusResponse };
    DefaultSignUpBonusMetadata: CountryLevelSignUpBonus;
  }> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetAllCountryLevelSignUpBonuses,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminUpdateJumioCountrySignUpBonus(
    endpoint: string,
    AdminPublicKey: string,
    CountryCode: string,
    CountryLevelSignUpBonus: CountryLevelSignUpBonus
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateJumioCountrySignUpBonus,
      AdminPublicKey,
      {
        AdminPublicKey,
        CountryCode,
        CountryLevelSignUpBonus,
      }
    );
  }

  AdminCreateReferralHash(
    endpoint: string,
    AdminPublicKey: string,
    UserPublicKeyBase58Check: string,
    Username: string,
    ReferrerAmountUSDCents: number,
    RefereeAmountUSDCents: number,
    MaxReferrals: number,
    RequiresJumio: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminCreateReferralHash,
      AdminPublicKey,
      {
        UserPublicKeyBase58Check,
        Username,
        ReferrerAmountUSDCents,
        RefereeAmountUSDCents,
        MaxReferrals,
        RequiresJumio,
        AdminPublicKey,
      }
    );
  }

  AdminUpdateReferralHash(
    endpoint: string,
    AdminPublicKey: string,
    ReferralHashBase58: string,
    ReferrerAmountUSDCents: number,
    RefereeAmountUSDCents: number,
    MaxReferrals: number,
    RequiresJumio: boolean,
    IsActive: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateReferralHash,
      AdminPublicKey,
      {
        ReferralHashBase58,
        ReferrerAmountUSDCents,
        RefereeAmountUSDCents,
        MaxReferrals,
        RequiresJumio,
        IsActive,
        AdminPublicKey,
      }
    );
  }

  AdminGetAllReferralInfoForUser(
    endpoint: string,
    AdminPublicKey: string,
    UserPublicKeyBase58Check: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetAllReferralInfoForUser,
      AdminPublicKey,
      {
        UserPublicKeyBase58Check,
        Username,
        AdminPublicKey,
      }
    );
  }

  AdminDownloadReferralCSV(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminDownloadReferralCSV,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminUploadReferralCSV(
    endpoint: string,
    AdminPublicKey: string,
    file: File
  ): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(AdminPublicKey),
    });
    return request.pipe(
      switchMap((signed) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('UserPublicKeyBase58Check', AdminPublicKey);
        formData.append('JWT', signed.jwt);

        return this.post(
          endpoint,
          BackendRoutes.RoutePathAdminUploadReferralCSV,
          formData
        );
      })
    );
  }

  GetReferralInfoForUser(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathGetReferralInfoForUser,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
      }
    );
  }

  GetReferralInfoForReferralHash(
    endpoint: string,
    ReferralHash: string
  ): Observable<{
    ReferralInfoResponse: any;
    CountrySignUpBonus: CountryLevelSignUpBonus;
  }> {
    return this.post(
      endpoint,
      BackendRoutes.RoutePathGetReferralInfoForReferralHash,
      {
        ReferralHash,
      }
    );
  }

  AdminResetTutorialStatus(
    endpoint: string,
    AdminPublicKey: string,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminResetTutorialStatus,
      AdminPublicKey,
      {
        PublicKeyBase58Check,
        AdminPublicKey,
      }
    );
  }

  AdminUpdateTutorialCreators(
    endpoint: string,
    AdminPublicKey: string,
    PublicKeyBase58Check: string,
    IsRemoval: boolean,
    IsWellKnown: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminUpdateTutorialCreators,
      AdminPublicKey,
      {
        PublicKeyBase58Check,
        IsRemoval,
        IsWellKnown,
        AdminPublicKey,
      }
    );
  }

  GetTutorialCreators(
    endpoint: string,
    PublicKeyBase58Check: string,
    ResponseLimit: number
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetTutorialCreators, {
      ResponseLimit,
      PublicKeyBase58Check,
    });
  }

  AdminGetTutorialCreators(
    endpoint: string,
    PublicKeyBase58Check: string,
    ResponseLimit: number
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetTutorialCreators,
      PublicKeyBase58Check,
      {
        ResponseLimit,
        PublicKeyBase58Check,
        AdminPublicKey: PublicKeyBase58Check,
      }
    );
  }

  GetWyreWalletOrderForPublicKey(
    endpoint: string,
    AdminPublicKeyBase58Check: string,
    PublicKeyBase58Check: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathGetWyreWalletOrdersForPublicKey,
      AdminPublicKeyBase58Check,
      {
        AdminPublicKey: AdminPublicKeyBase58Check,
        PublicKeyBase58Check,
        Username,
      }
    );
  }

  // Wyre
  GetWyreWalletOrderQuotation(
    endpoint: string,
    SourceAmount: number,
    Country: string,
    SourceCurrency: string
  ): Observable<any> {
    return this.post(
      endpoint,
      BackendRoutes.RoutePathGetWyreWalletOrderQuotation,
      {
        SourceAmount,
        Country,
        SourceCurrency,
      }
    );
  }

  GetWyreWalletOrderReservation(
    endpoint: string,
    ReferenceId: string,
    SourceAmount: number,
    Country: string,
    SourceCurrency: string
  ): Observable<any> {
    return this.post(
      endpoint,
      BackendRoutes.RoutePathGetWyreWalletOrderReservation,
      {
        ReferenceId,
        SourceAmount,
        Country,
        SourceCurrency,
      }
    );
  }

  // Admin Node Fee Endpoints
  AdminSetTxnFeeForTxnType(
    endpoint: string,
    AdminPublicKey: string,
    TransactionType: string,
    NewTransactionFees: TransactionFee[]
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminSetTransactionFeeForTransactionType,
      AdminPublicKey,
      {
        AdminPublicKey,
        TransactionType,
        NewTransactionFees,
      }
    );
  }

  AdminSetAllTransactionFees(
    endpoint: string,
    AdminPublicKey: string,
    NewTransactionFees: TransactionFee[]
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminSetAllTransactionFees,
      AdminPublicKey,
      {
        AdminPublicKey,
        NewTransactionFees,
      }
    );
  }

  AdminGetTransactionFeeMap(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetTransactionFeeMap,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  AdminAddExemptPublicKey(
    endpoint: string,
    AdminPublicKey: string,
    PublicKeyBase58Check: string,
    IsRemoval: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminAddExemptPublicKey,
      AdminPublicKey,
      {
        AdminPublicKey,
        PublicKeyBase58Check,
        IsRemoval,
      }
    );
  }

  AdminGetExemptPublicKeys(
    endpoint: string,
    AdminPublicKey: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathAdminGetExemptPublicKeys,
      AdminPublicKey,
      {
        AdminPublicKey,
      }
    );
  }

  // Tutorial Endpoints
  StartOrSkipTutorial(
    endpoint: string,
    PublicKeyBase58Check: string,
    IsSkip: boolean
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathStartOrSkipTutorial,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
        IsSkip,
      }
    );
  }

  CompleteTutorial(
    endpoint: string,
    PublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(
      endpoint,
      BackendRoutes.RoutePathCompleteTutorial,
      PublicKeyBase58Check,
      {
        PublicKeyBase58Check,
      }
    );
  }

  GetVideoStatus(endpoint: string, videoId: string): Observable<any> {
    return this.get(
      endpoint,
      `${BackendRoutes.RoutePathGetVideoStatus}/${videoId}`
    );
  }

  GetTotalSupply(endpoint: string): Observable<number> {
    return this.get(endpoint, BackendRoutes.RoutePathGetTotalSupply);
  }

  GetRichList(endpoint: string): Observable<RichListEntryResponse[]> {
    return this.get(endpoint, BackendRoutes.RoutePathGetRichList);
  }

  GetCountOfKeysWithDESO(endpoint: string): Observable<number> {
    return this.get(endpoint, BackendRoutes.RoutePathGetCountKeysWithDESO);
  }

  GetLockupYieldCurvePoints(endpoint: string, publicKey: string): Observable<LockupYieldCurvePointResponse[]> {
    return this.get(endpoint, BackendRoutes.RoutePathLockupYieldCurvePoints + "/" + publicKey);
  }

  GetLockedBalanceEntries(endpoint: string, publicKey: string): Observable<CumulativeLockedBalanceEntryResponse[]> {
    return this.get(endpoint, BackendRoutes.RoutePathLockedBalanceEntries + "/" + publicKey);
  }

  CoinLockup(
    endpoint: string,
    TransactorPublicKeyBase58Check: string,
    ProfilePublicKeyBase58Check: string,
    RecipientPublicKeyBase58Check: string,
    UnlockTimestampNanoSecs: number,
    VestingEndTimestampNanoSecs: number,
    LockupAmountBaseUnits: Hex,
    ExtraData: { [k: string]: string },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCoinLockup, {
      TransactorPublicKeyBase58Check,
      ProfilePublicKeyBase58Check,
      RecipientPublicKeyBase58Check,
      UnlockTimestampNanoSecs,
      VestingEndTimestampNanoSecs,
      LockupAmountBaseUnits,
      ExtraData,
    MinFeeRateNanosPerKB,
  });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      TransactorPublicKeyBase58Check,
    )
  };

  UpdateCoinLockupParams(
    endpoint: string,
    TransactorPublicKeyBase58Check: string,
    LockupYieldDurationNanoSecs: number,
    LockupYieldAPYBasisPoints: number,
    RemoveYieldCurvePoint: boolean,
    NewLockupTransferRestrictions: boolean,
    LockupTransferRestrictionStatus: TransferRestrictionStatusString,
    ExtraData: { [k: string]: string },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathUpdateCoinLockupParams, {
      TransactorPublicKeyBase58Check,
      LockupYieldDurationNanoSecs,
      LockupYieldAPYBasisPoints,
      RemoveYieldCurvePoint,
      NewLockupTransferRestrictions,
      LockupTransferRestrictionStatus,
      ExtraData,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      TransactorPublicKeyBase58Check,
    )
  };

  CoinLockupTransfer(
    endpoint: string,
    TransactorPublicKeyBase58Check: string,
    ProfilePublicKeyBase58Check: string,
    RecipientPublicKeyBase58Check: string,
    UnlockTimestampNanoSecs: number,
    LockedCoinsToTransferBaseUnits: Hex,
    ExtraData: { [k: string]: string },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCoinLockupTransfer, {
      TransactorPublicKeyBase58Check,
      ProfilePublicKeyBase58Check,
      RecipientPublicKeyBase58Check,
      UnlockTimestampNanoSecs,
      LockedCoinsToTransferBaseUnits,
      ExtraData,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      TransactorPublicKeyBase58Check,
    )
  };

  CoinUnlock(
    endpoint: string,
    TransactorPublicKeyBase58Check: string,
    ProfilePublicKeyBase58Check: string,
    ExtraData: { [k: string]: string },
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCoinUnlock, {
      TransactorPublicKeyBase58Check,
      ProfilePublicKeyBase58Check,
      ExtraData,
      MinFeeRateNanosPerKB,
    });
    return this.signAndSubmitTransaction(
      endpoint,
      request,
      TransactorPublicKeyBase58Check,
    )
  };

  GetBaseCurrencyPrice(
    endpoint: string,
    Entries: { BaseCurrencyPublicKeyBase58Check: string; QuoteCurrencyPublicKeyBase58Check: string; BaseCurrencyToSell: number; }[],
  ): Observable<any> {
    return this.post(
      endpoint, BackendRoutes.RoutePathGetBaseCurrencyPrice, {
        Entries,
      }
    );
  }

  // Error parsing
  stringifyError(err): string {
    if (err && err.error && err.error.error) {
      return err.error.error;
    }

    return JSON.stringify(err);
  }

  parsePostError(err): string {
    if (err.status === 0) {
      return `${environment.node.name} is experiencing heavy load. Please try again in one minute.`;
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf('not sufficient') >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf('with password') >= 0) {
        errorMessage = 'The password you entered was incorrect.';
      } else if (
        errorMessage.indexOf('RuleErrorExistingStakeExceedsMaxAllowed') >= 0
      ) {
        errorMessage =
          'Another staker staked to this post right before you. Please try again.';
      } else if (errorMessage.indexOf('already has stake') >= 0) {
        errorMessage = 'You cannot stake to the same post more than once.';
      }
    }
    return errorMessage;
  }

  parseProfileError(err): string {
    if (err.status === 0) {
      return `${environment.node.name} is experiencing heavy load. Please try again in one minute.`;
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf('not sufficient') >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf('with password') >= 0) {
        errorMessage = 'The password you entered was incorrect.';
      } else if (
        errorMessage.indexOf('RuleErrorExistingStakeExceedsMaxAllowed') >= 0
      ) {
        errorMessage =
          'Another staker staked to this profile right before you. Please try again.';
      } else if (errorMessage.indexOf('already has stake') >= 0) {
        errorMessage = 'You cannot stake to the same profile more than once.';
      } else if (errorMessage.indexOf('RuleErrorProfileUsernameExists') >= 0) {
        errorMessage = 'Sorry, someone has already taken this username.';
      } else if (errorMessage.indexOf('RuleErrorUserDescriptionLen') >= 0) {
        errorMessage = 'Your description is too long.';
      } else if (errorMessage.indexOf('RuleErrorProfileUsernameTooLong') >= 0) {
        errorMessage = 'Your username is too long.';
      } else if (errorMessage.indexOf('RuleErrorInvalidUsername') >= 0) {
        errorMessage =
          'Your username contains invalid characters. Usernames can only numbers, English letters, and underscores.';
      } else if (
        errorMessage.indexOf('RuleErrorCreatorCoinTransferInsufficientCoins') >=
        0
      ) {
        errorMessage =
          'You need more of your own creator coin to give a diamond of this level.';
      } else if (
        errorMessage.indexOf('RuleErrorInputSpendsPreviouslySpentOutput') >= 0
      ) {
        errorMessage =
          "You're doing that a bit too quickly. Please wait a second or two and try again.";
      } else if (
        errorMessage.indexOf(
          'RuleErrorCreatorCoinTransferBalanceEntryDoesNotExist'
        ) >= 0
      ) {
        errorMessage = 'You must own this creator coin before transferring it.';
      } else if (
        errorMessage.indexOf(
          'RuleErrorCreatorCoinBuyMustTradeNonZeroDeSoAfterFounderReward'
        ) >= 0
      ) {
        errorMessage =
          "This creator has set their founder's reward to 100%. " +
          "You cannot buy creators that have set their founder's reward to 100%.";
      }
    }
    return errorMessage;
  }

  parseMessageError(err): string {
    if (err.status === 0) {
      return `${environment.node.name} is experiencing heavy load. Please try again in one minute.`;
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf('not sufficient') >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf('with password') >= 0) {
        errorMessage = 'The password you entered was incorrect.';
      } else if (
        errorMessage.indexOf(
          'RuleErrorPrivateMessageSenderPublicKeyEqualsRecipientPublicKey'
        ) >= 0
      ) {
        errorMessage = `You can't message yourself.`;
      } else if (errorMessage.indexOf('Problem decoding recipient') >= 0) {
        errorMessage = `The public key you entered is invalid. Check that you copied it in correctly.`;
      }
    }
    return errorMessage;
  }
}
