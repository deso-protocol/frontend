// FYI: any request that needs the HttpOnly cookie to be sent (e.g. b/c the server
// needs the seed phrase) needs the {withCredentials: true} option. It may also needed to
// get the browser to save the cookie in the response.
// https://github.com/github/fetch#sending-cookies
import { Injectable } from "@angular/core";
import { Observable, of, throwError } from "rxjs";
import { map, switchMap, catchError, mapTo } from "rxjs/operators";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { IdentityService } from "./identity.service";

export class BackendRoutes {
  static ExchangeRateRoute = "/api/v0/get-exchange-rate";
  static ExchangeBitcoinRoute = "/api/v0/exchange-bitcoin";
  static SendBitCloutRoute = "/api/v0/send-bitclout";
  static MinerControlRoute = "/api/v0/miner-control";

  static GetUsersStatelessRoute = "/api/v0/get-users-stateless";
  static RoutePathSubmitPost = "/api/v0/submit-post";
  static RoutePathUploadImage = "/api/v0/upload-image";
  static RoutePathSubmitTransaction = "/api/v0/submit-transaction";
  static RoutePathUpdateProfile = "/api/v0/update-profile";
  static RoutePathGetPostsStateless = "/api/v0/get-posts-stateless";
  static RoutePathGetProfiles = "/api/v0/get-profiles";
  static RoutePathGetSingleProfile = "/api/v0/get-single-profile";
  static RoutePathGetSingleProfilePicture = "/api/v0/get-single-profile-picture";
  static RoutePathGetPostsForPublicKey = "/api/v0/get-posts-for-public-key";
  static RoutePathGetDiamondedPosts = "/api/v0/get-diamonded-posts";
  static RoutePathGetHodlersForPublicKey = "/api/v0/get-hodlers-for-public-key";
  static RoutePathSendMessageStateless = "/api/v0/send-message-stateless";
  static RoutePathGetMessagesStateless = "/api/v0/get-messages-stateless";
  static RoutePathMarkContactMessagesRead = "/api/v0/mark-contact-messages-read";
  static RoutePathMarkAllMessagesRead = "/api/v0/mark-all-messages-read";
  static RoutePathGetFollowsStateless = "/api/v0/get-follows-stateless";
  static RoutePathCreateFollowTxnStateless = "/api/v0/create-follow-txn-stateless";
  static RoutePathCreateLikeStateless = "/api/v0/create-like-stateless";
  static RoutePathBuyOrSellCreatorCoin = "/api/v0/buy-or-sell-creator-coin";
  static RoutePathTransferCreatorCoin = "/api/v0/transfer-creator-coin";
  static RoutePathUpdateUserGlobalMetadata = "/api/v0/update-user-global-metadata";
  static RoutePathGetUserGlobalMetadata = "/api/v0/get-user-global-metadata";
  static RoutePathGetNotifications = "/api/v0/get-notifications";
  static RoutePathGetAppState = "/api/v0/get-app-state";
  static RoutePathGetSinglePost = "/api/v0/get-single-post";
  static RoutePathSendPhoneNumberVerificationText = "/api/v0/send-phone-number-verification-text";
  static RoutePathSubmitPhoneNumberVerificationCode = "/api/v0/submit-phone-number-verification-code";
  static RoutePathBlockPublicKey = "/api/v0/block-public-key";
  static RoutePathGetBlockTemplate = "/api/v0/get-block-template";
  static RoutePathGetTxn = "/api/v0/get-txn";
  static RoutePathDeleteIdentities = "/api/v0/delete-identities";
  static RoutePathSendDiamonds = "/api/v0/send-diamonds";
  static RoutePathGetDiamondsForPublicKey = "/api/v0/get-diamonds-for-public-key";
  static RoutePathGetLikesForPost = "/api/v0/get-likes-for-post";
  static RoutePathGetDiamondsForPost = "/api/v0/get-diamonds-for-post";
  static RoutePathGetRecloutsForPost = "/api/v0/get-reclouts-for-post";
  static RoutePathGetQuoteRecloutsForPost = "/api/v0/get-quote-reclouts-for-post";

  // Admin routes.
  static NodeControlRoute = "/api/v0/admin/node-control";
  static ReprocessBitcoinBlockRoute = "/api/v0/admin/reprocess-bitcoin-block";
  static RoutePathSwapIdentity = "/api/v0/admin/swap-identity";
  static RoutePathAdminUpdateUserGlobalMetadata = "/api/v0/admin/update-user-global-metadata";
  static RoutePathAdminGetAllUserGlobalMetadata = "/api/v0/admin/get-all-user-global-metadata";
  static RoutePathAdminGetUserGlobalMetadata = "/api/v0/admin/get-user-global-metadata";
  static RoutePathAdminUpdateGlobalFeed = "/api/v0/admin/update-global-feed";
  static RoutePathAdminPinPost = "/api/v0/admin/pin-post";
  static RoutePathAdminRemoveNilPosts = "/api/v0/admin/remove-nil-posts";
  static RoutePathAdminGetMempoolStats = "/api/v0/admin/get-mempool-stats";
  static RoutePathAdminGrantVerificationBadge = "/api/v0/admin/grant-verification-badge";
  static RoutePathAdminRemoveVerificationBadge = "/api/v0/admin/remove-verification-badge";
  static RoutePathAdminGetVerifiedUsers = "/api/v0/admin/get-verified-users";
  static RoutePathAdminGetUserAdminData = "/api/v0/admin/get-user-admin-data";
  static RoutePathAdminGetUsernameVerificationAuditLogs = "/api/v0/admin/get-username-verification-audit-logs";
  static RoutePathUpdateGlobalParams = "/api/v0/admin/update-global-params";
  static RoutePathSetUSDCentsToBitCloutReserveExchangeRate =
    "/api/v0/admin/set-usd-cents-to-bitclout-reserve-exchange-rate";
  static RoutePathGetUSDCentsToBitCloutReserveExchangeRate =
    "/api/v0/admin/get-usd-cents-to-bitclout-reserve-exchange-rate";
  static RoutePathSetBuyBitCloutFeeBasisPoints = "/api/v0/admin/set-buy-bitclout-fee-basis-points";
  static RoutePathGetBuyBitCloutFeeBasisPoints = "/api/v0/admin/get-buy-bitclout-fee-basis-points";
  static RoutePathGetGlobalParams = "/api/v0/admin/get-global-params";
  static RoutePathEvictUnminedBitcoinTxns = "/api/v0/admin/evict-unmined-bitcoin-txns";
  static RoutePathGetWyreWalletOrdersForPublicKey = "/api/v0/admin/get-wyre-wallet-orders-for-public-key";

  static RoutePathGetFullTikTokURL = "/api/v0/get-full-tiktok-url";

  // Wyre routes.
  static RoutePathGetWyreWalletOrderQuotation = "/api/v0/get-wyre-wallet-order-quotation";
  static RoutePathGetWyreWalletOrderReservation = "/api/v0/get-wyre-wallet-order-reservation";
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

export class ProfileEntryResponse {
  Username: string;
  Description: string;
  ProfilePic?: string;
  CoinEntry?: {
    BitCloutLockedNanos: number;
    CoinWatermarkNanos: number;
    CoinsInCirculationNanos: number;
    CreatorBasisPoints: number;
  };
  CoinPriceBitCloutNanos?: number;
  StakeMultipleBasisPoints?: number;
  PublicKeyBase58Check?: string;
  UsersThatHODL?: any;
  Posts?: PostEntryResponse[];
  IsReserved?: boolean;
  IsVerified?: boolean;
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
  BlockedPubKeys: { [key: string]: object };

  IsAdmin?: boolean;
  IsSuperAdmin?: boolean;
}

export class PostEntryResponse {
  PostHashHex: string;
  PosterPublicKeyBase58Check: string;
  ParentStakeID: string;
  Body: string;
  RecloutedPostHashHex: string;
  ImageURLs: string[];
  RecloutPost: PostEntryResponse;
  CreatorBasisPoints: number;
  StakeMultipleBasisPoints: number;
  TimestampNanos: number;
  IsHidden: boolean;
  ConfirmationBlockHeight: number;
  StakeEntry: any;
  StakeEntryStats: any;
  // PostEntryResponse of the post that this post reclouts.
  RecloutedPostEntryResponse: PostEntryResponse;
  // The profile associated with this post.
  ProfileEntryResponse: ProfileEntryResponse;
  // The comments associated with this post.
  Comments: PostEntryResponse[];
  LikeCount: number;
  RecloutCount: number;
  QuoteRecloutCount: number;
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
}

export class DiamondsPost {
  Post: PostEntryResponse;
  // Boolean that is set to true when this is the first post at a given diamond level.
  ShowDiamondDivider?: boolean;
}

export class PostEntryReaderState {
  // This is true if the reader has liked the associated post.
  LikedByReader?: boolean;

  // This is true if the reader has reclouted the associated post.
  RecloutedByReader?: boolean;

  // This is the post hash hex of the reclout
  RecloutPostHashHex?: string;

  // Level of diamond the user gave this post.
  DiamondLevelBestowed?: number;
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
  // The net effect of transactions in the mempool on a given BalanceEntry's BalanceNanos.
  // This is used by the frontend to convey info about mining.
  NetBalanceInMempool: number;

  ProfileEntryResponse: ProfileEntryResponse;
}

@Injectable({
  providedIn: "root",
})
export class BackendApiService {
  constructor(private httpClient: HttpClient, private identityService: IdentityService) {}

  static GET_PROFILES_ORDER_BY_INFLUENCER_COIN_PRICE = "influencer_coin_price";
  static BUY_CREATOR_COIN_OPERATION_TYPE = "buy";
  static SELL_CREATOR_COIN_OPERATION_TYPE = "sell";

  // TODO: Cleanup - this should be a configurable value on the node. Leaving it in the frontend
  // is fine for now because BlockCypher has strong anti-abuse measures in place.
  blockCypherToken = "cd455c8a5d404bb0a23880b72f56aa86";

  // Store sent messages and associated metadata in localStorage
  MessageMetaKey = "messageMetaKey";

  // Store the identity users in localStorage
  IdentityUsersKey = "identityUsers";

  // Store last local node URL in localStorage
  LastLocalNodeKey = "lastLocalNodeV2";

  // Store last logged in user public key in localStorage
  LastLoggedInUserKey = "lastLoggedInUser";

  // Store the last identity service URL in localStorage
  LastIdentityServiceKey = "lastIdentityServiceURL";

  // TODO: Wipe all this data when transition is complete
  LegacyUserListKey = "userList";
  LegacySeedListKey = "seedList";

  SetStorage(key: string, value: any) {
    localStorage.setItem(key, value ? JSON.stringify(value) : "");
  }

  RemoveStorage(key: string) {
    localStorage.removeItem(key);
  }

  GetStorage(key: string) {
    const data = localStorage.getItem(key);
    if (data === "") {
      return null;
    }

    return JSON.parse(data);
  }

  // Assemble a URL to hit the BE with.
  _makeRequestURL(endpoint: string, routeName: string, adminPublicKey?: string): string {
    let queryURL = location.protocol + "//" + endpoint + routeName;
    // If the protocol is specified within the endpoint then use that.
    if (endpoint.startsWith("http")) {
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
      console.error("An error occurred:", error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(`Backend returned code ${error.status}, ` + `body was: ${JSON.stringify(error.error)}`);
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

  signAndSubmitTransaction(endpoint: string, request: Observable<any>, PublicKeyBase58Check: string): Observable<any> {
    return request
      .pipe(
        switchMap((res) =>
          this.identityService
            .sign({
              transactionHex: res.TransactionHex,
              ...this.identityService.identityServiceParamsForKey(PublicKeyBase58Check),
            })
            .pipe(
              switchMap((signed) => {
                if (signed.approvalRequired) {
                  return this.identityService
                    .launch("/approve", {
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
    return this.httpClient.get<any>(this._makeRequestURL(endpoint, path)).pipe(catchError(this._handleError));
  }

  post(endpoint: string, path: string, body: any): Observable<any> {
    return this.httpClient.post<any>(this._makeRequestURL(endpoint, path), body).pipe(catchError(this._handleError));
  }

  jwtPost(endpoint: string, path: string, publicKey: string, body: any): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(publicKey),
    });

    return request.pipe(
      switchMap((signed) => {
        body = {
          JWT: signed.jwt,
          ...body,
        };

        return this.post(endpoint, path, body).pipe(map((res) => ({ ...res, ...signed })));
      })
    );
  }

  GetExchangeRate(endpoint: string): Observable<any> {
    return this.get(endpoint, BackendRoutes.ExchangeRateRoute);
  }

  // Use empty string to return all top categories.
  GetBitcoinFeeRateSatoshisPerKB(): Observable<any> {
    return this.httpClient.get<any>("https://api.blockchain.com/mempool/fees").pipe(catchError(this._handleError));
  }

  SendPhoneNumberVerificationText(
    endpoint: string,
    PublicKeyBase58Check: string,
    PhoneNumber: string,
    PhoneNumberCountryCode: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathSendPhoneNumberVerificationText, {
      PublicKeyBase58Check,
      PhoneNumber,
      PhoneNumberCountryCode,
    });
  }

  SubmitPhoneNumberVerificationCode(
    endpoint: string,
    PublicKeyBase58Check: string,
    PhoneNumber: string,
    PhoneNumberCountryCode: string,
    VerificationCode: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathSubmitPhoneNumberVerificationCode, {
      PublicKeyBase58Check,
      PhoneNumber,
      PhoneNumberCountryCode,
      VerificationCode,
    });
  }

  GetBlockTemplate(endpoint: string, PublicKeyBase58Check: string): Observable<any> {
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
      .post<any>(this._makeRequestURL(endpoint, BackendRoutes.RoutePathDeleteIdentities), {}, { withCredentials: true })
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
    let req = this.post(endpoint, BackendRoutes.ExchangeBitcoinRoute, {
      PublicKeyBase58Check,
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
              ...this.identityService.identityServiceParamsForKey(PublicKeyBase58Check),
              unsignedHashes: res.UnsignedHashes,
            })
            .pipe(map((signed) => ({ ...res, ...signed })))
        )
      );

      req = req.pipe(
        switchMap((res) =>
          this.post(endpoint, BackendRoutes.ExchangeBitcoinRoute, {
            PublicKeyBase58Check,
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
  SendBitCloutPreview(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    RecipientPublicKeyOrUsername: string,
    AmountNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.SendBitCloutRoute, {
      SenderPublicKeyBase58Check,
      RecipientPublicKeyOrUsername,
      AmountNanos: Math.floor(AmountNanos),
      MinFeeRateNanosPerKB,
    });
  }

  SendBitClout(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    RecipientPublicKeyOrUsername: string,
    AmountNanos: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.SendBitCloutPreview(
      endpoint,
      SenderPublicKeyBase58Check,
      RecipientPublicKeyOrUsername,
      AmountNanos,
      MinFeeRateNanosPerKB
    );

    return this.signAndSubmitTransaction(endpoint, request, SenderPublicKeyBase58Check);
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
    const request = this.post(endpoint, BackendRoutes.RoutePathSendMessageStateless, {
      SenderPublicKeyBase58Check,
      RecipientPublicKeyBase58Check,
      MessageText,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(endpoint, request, SenderPublicKeyBase58Check);
  }

  // User-related functions.
  GetUsersStateless(endpoint: string, publicKeys: any[], SkipForLeaderboard: boolean = false): Observable<any> {
    return this.post(endpoint, BackendRoutes.GetUsersStatelessRoute, {
      PublicKeysBase58Check: publicKeys,
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

  UploadImage(endpoint: string, UserPublicKeyBase58Check: string, file: File): Observable<any> {
    const request = this.identityService.jwt({
      ...this.identityService.identityServiceParamsForKey(UserPublicKeyBase58Check),
    });
    return request.pipe(
      switchMap((signed) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("UserPublicKeyBase58Check", UserPublicKeyBase58Check);
        formData.append("JWT", signed.jwt);

        return this.post(endpoint, BackendRoutes.RoutePathUploadImage, formData);
      })
    );
  }

  SubmitPost(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    PostHashHexToModify: string,
    ParentStakeID: string,
    Title: string,
    BodyObj: any,
    RecloutedPostHashHex: string,
    PostExtraData: any,
    Sub: string,
    IsHidden: boolean,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathSubmitPost, {
      UpdaterPublicKeyBase58Check,
      PostHashHexToModify,
      ParentStakeID,
      Title,
      BodyObj,
      RecloutedPostHashHex,
      PostExtraData,
      Sub,
      IsHidden,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(endpoint, request, UpdaterPublicKeyBase58Check);
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
    GetPostsByClout: boolean,
    MediaRequired: boolean,
    PostsByCloutMinutesLookback: number,
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
      GetPostsByClout,
      MediaRequired,
      PostsByCloutMinutesLookback,
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
  GetSingleProfile(endpoint: string, PublicKeyBase58Check: string, Username: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetSingleProfile, {
      PublicKeyBase58Check,
      Username,
    });
  }

  // We add a ts-ignore here as typescript does not expect responseType to be anything but "json".
  GetSingleProfilePicture(endpoint: string, PublicKeyBase58Check: string, bustCache: string = ""): Observable<any> {
    return this.httpClient.get<any>(this.GetSingleProfilePictureURL(endpoint, PublicKeyBase58Check, bustCache), {
      // @ts-ignore
      responseType: "blob",
    });
  }
  GetSingleProfilePictureURL(endpoint: string, PublicKeyBase58Check: string, fallback): string {
    return this._makeRequestURL(
      endpoint,
      BackendRoutes.RoutePathGetSingleProfilePicture + "/" + PublicKeyBase58Check + "?" + fallback
    );
  }
  GetDefaultProfilePictureURL(endpoint: string): string {
    return this._makeRequestURL(endpoint, "/assets/img/default_profile_pic.png");
  }

  GetPostsForPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    Username: string,
    ReaderPublicKeyBase58Check: string,
    LastPostHashHex: string,
    NumToFetch: number,
    MediaRequired: boolean
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetPostsForPublicKey, {
      PublicKeyBase58Check,
      Username,
      ReaderPublicKeyBase58Check,
      LastPostHashHex,
      NumToFetch,
      MediaRequired,
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
    FetchAll: boolean = false
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetHodlersForPublicKey, {
      PublicKeyBase58Check,
      Username,
      LastPublicKeyBase58Check,
      NumToFetch,
      FetchHodlings,
      FetchAll,
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
    });

    return this.signAndSubmitTransaction(endpoint, request, UpdaterPublicKeyBase58Check);
  }

  GetFollows(
    endpoint: string,
    Username: string,
    PublicKeyBase58Check: string,
    GetEntriesFollowingUsername: boolean,
    LastPublicKeyBase58Check: string = "",
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
    const request = this.post(endpoint, BackendRoutes.RoutePathCreateFollowTxnStateless, {
      FollowerPublicKeyBase58Check,
      FollowedPublicKeyBase58Check,
      IsUnfollow,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(endpoint, request, FollowerPublicKeyBase58Check);
  }

  GetMessages(
    endpoint: string,
    PublicKeyBase58Check: string,
    FetchAfterPublicKeyBase58Check: string = "",
    NumToFetch: number = 25,
    HoldersOnly: boolean = false,
    HoldingsOnly: boolean = false,
    FollowersOnly: boolean = false,
    FollowingOnly: boolean = false,
    SortAlgorithm: string = "time"
  ): Observable<any> {
    let req = this.httpClient.post<any>(this._makeRequestURL(endpoint, BackendRoutes.RoutePathGetMessagesStateless), {
      PublicKeyBase58Check,
      FetchAfterPublicKeyBase58Check,
      NumToFetch,
      HoldersOnly,
      HoldingsOnly,
      FollowersOnly,
      FollowingOnly,
      SortAlgorithm,
    });

    // create an array of messages to decrypt
    req = req.pipe(
      map((res) => {
        const encryptedHexes = [];
        for (const threads of res.OrderedContactsWithMessages) {
          for (const message of threads.Messages) {
            if (message.IsSender) {
              continue;
            }

            encryptedHexes.push(message.EncryptedText);
          }
        }
        return { ...res, encryptedHexes };
      })
    );

    // decrypt all the messages
    req = req.pipe(
      switchMap((res) =>
        this.identityService
          .decrypt({
            ...this.identityService.identityServiceParamsForKey(PublicKeyBase58Check),
            encryptedHexes: res.encryptedHexes,
          })
          .pipe(
            map((decrypted) => {
              for (const threads of res.OrderedContactsWithMessages) {
                for (const message of threads.Messages) {
                  message.DecryptedText = decrypted.decryptedHexes[message.EncryptedText];
                }
              }

              return { ...res, ...decrypted };
            })
          )
      )
    );

    return req.pipe(catchError(this._handleError));
  }

  CreateLike(
    endpoint: string,
    ReaderPublicKeyBase58Check: string,
    LikedPostHashHex: string,
    IsUnlike: boolean,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathCreateLikeStateless, {
      ReaderPublicKeyBase58Check,
      LikedPostHashHex,
      IsUnlike,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(endpoint, request, ReaderPublicKeyBase58Check);
  }

  SendDiamonds(
    endpoint: string,
    SenderPublicKeyBase58Check: string,
    ReceiverPublicKeyBase58Check: string,
    DiamondPostHashHex: string,
    DiamondLevel: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.post(endpoint, BackendRoutes.RoutePathSendDiamonds, {
      SenderPublicKeyBase58Check,
      ReceiverPublicKeyBase58Check,
      DiamondPostHashHex,
      DiamondLevel,
      MinFeeRateNanosPerKB,
    });

    return this.signAndSubmitTransaction(endpoint, request, SenderPublicKeyBase58Check);
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

  GetRecloutsForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetRecloutsForPost, {
      PostHashHex,
      Offset,
      Limit,
      ReaderPublicKeyBase58Check,
    });
  }

  GetQuoteRecloutsForPost(
    endpoint: string,
    PostHashHex: string,
    Offset: number,
    Limit: number,
    ReaderPublicKeyBase58Check: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetQuoteRecloutsForPost, {
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
    // set. In a Buy transaction, BitCloutToSellNanos will be converted into
    // creator coin on behalf of the user. In a Sell transaction,
    // CreatorCoinToSellNanos will be converted into BitClout. In an AddBitClout
    // operation, BitCloutToAddNanos will be aded for the user. This allows us to
    // support multiple transaction types with same meta field.
    BitCloutToSellNanos: number,
    CreatorCoinToSellNanos: number,
    BitCloutToAddNanos: number,
    // When a user converts BitClout into CreatorCoin, MinCreatorCoinExpectedNanos
    // specifies the minimum amount of creator coin that the user expects from their
    // transaction. And vice versa when a user is converting CreatorCoin for BitClout.
    // Specifying these fields prevents the front-running of users' buy/sell. Setting
    // them to zero turns off the check. Give it your best shot, Ivan.
    MinBitCloutExpectedNanos: number,
    MinCreatorCoinExpectedNanos: number,

    MinFeeRateNanosPerKB: number,
    Broadcast: boolean
  ): Observable<any> {
    BitCloutToSellNanos = Math.floor(BitCloutToSellNanos);
    CreatorCoinToSellNanos = Math.floor(CreatorCoinToSellNanos);
    BitCloutToAddNanos = Math.floor(BitCloutToAddNanos);
    MinBitCloutExpectedNanos = Math.floor(MinBitCloutExpectedNanos);
    MinCreatorCoinExpectedNanos = Math.floor(MinCreatorCoinExpectedNanos);

    let request = this.post(endpoint, BackendRoutes.RoutePathBuyOrSellCreatorCoin, {
      UpdaterPublicKeyBase58Check,
      CreatorPublicKeyBase58Check,
      OperationType,
      BitCloutToSellNanos,
      CreatorCoinToSellNanos,
      BitCloutToAddNanos,
      MinBitCloutExpectedNanos,
      MinCreatorCoinExpectedNanos,
      MinFeeRateNanosPerKB,
    });

    if (Broadcast) {
      request = this.signAndSubmitTransaction(endpoint, request, UpdaterPublicKeyBase58Check);
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
      request = this.signAndSubmitTransaction(endpoint, request, SenderPublicKeyBase58Check);
    }

    return request;
  }

  BlockPublicKey(
    endpoint: string,
    PublicKeyBase58Check: string,
    BlockPublicKeyBase58Check: string,
    Unblock: boolean = false
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathBlockPublicKey, PublicKeyBase58Check, {
      PublicKeyBase58Check,
      BlockPublicKeyBase58Check,
      Unblock,
    });
  }

  MarkContactMessagesRead(
    endpoint: string,
    UserPublicKeyBase58Check: string,
    ContactPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathMarkContactMessagesRead, UserPublicKeyBase58Check, {
      UserPublicKeyBase58Check,
      ContactPublicKeyBase58Check,
    });
  }

  MarkAllMessagesRead(endpoint: string, UserPublicKeyBase58Check: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathMarkAllMessagesRead, UserPublicKeyBase58Check, {
      UserPublicKeyBase58Check,
    });
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
    return this.jwtPost(endpoint, BackendRoutes.RoutePathUpdateUserGlobalMetadata, UserPublicKeyBase58Check, {
      UserPublicKeyBase58Check,
      Email,
      MessageReadStateUpdatesByContact,
    });
  }

  GetUserGlobalMetadata(
    endpoint: string,

    // The public key of the user to update.
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathGetUserGlobalMetadata, UserPublicKeyBase58Check, {
      UserPublicKeyBase58Check,
    });
  }

  AdminGetVerifiedUsers(endpoint: string, AdminPublicKey: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetVerifiedUsers, AdminPublicKey, {
      AdminPublicKey,
    });
  }

  AdminGetUsernameVerificationAuditLogs(endpoint: string, AdminPublicKey: string, Username: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetUsernameVerificationAuditLogs, AdminPublicKey, {
      AdminPublicKey,
      Username,
    });
  }

  AdminGrantVerificationBadge(endpoint: string, AdminPublicKey: string, UsernameToVerify: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGrantVerificationBadge, AdminPublicKey, {
      AdminPublicKey,
      UsernameToVerify,
    });
  }

  AdminRemoveVerificationBadge(
    endpoint: string,
    AdminPublicKey: string,
    UsernameForWhomToRemoveVerification: string
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminRemoveVerificationBadge, AdminPublicKey, {
      AdminPublicKey,
      UsernameForWhomToRemoveVerification,
    });
  }

  AdminGetUserAdminData(endpoint: string, AdminPublicKey: string, UserPublicKeyBase58Check: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetUserAdminData, AdminPublicKey, {
      AdminPublicKey,
      UserPublicKeyBase58Check,
    });
  }

  NodeControl(endpoint: string, AdminPublicKey: string, Address: string, OperationType: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.NodeControlRoute, AdminPublicKey, {
      AdminPublicKey,
      Address,
      OperationType,
    });
  }

  UpdateMiner(endpoint: string, AdminPublicKey: string, MinerPublicKeys: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.NodeControlRoute, AdminPublicKey, {
      AdminPublicKey,
      MinerPublicKeys,
      OperationType: "update_miner",
    });
  }

  AdminGetUserGlobalMetadata(
    endpoint: string,
    AdminPublicKey: string,

    // The public key of the user for whom we'd like to get global metadata
    UserPublicKeyBase58Check: string
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetUserGlobalMetadata, AdminPublicKey, {
      AdminPublicKey,
      UserPublicKeyBase58Check,
    });
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
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminUpdateUserGlobalMetadata, AdminPublicKey, {
      UserPublicKeyBase58Check,
      Username,
      IsBlacklistUpdate,
      RemoveEverywhere,
      RemoveFromLeaderboard,
      IsWhitelistUpdate,
      WhitelistPosts,
      RemovePhoneNumberMetadata,
      AdminPublicKey,
    });
  }

  AdminGetAllUserGlobalMetadata(endpoint: string, AdminPublicKey: string, NumToFetch: number): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetAllUserGlobalMetadata, AdminPublicKey, {
      AdminPublicKey,
      NumToFetch,
    });
  }

  AdminPinPost(endpoint: string, AdminPublicKey: string, PostHashHex: string, UnpinPost: boolean): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminPinPost, AdminPublicKey, {
      AdminPublicKey,
      PostHashHex,
      UnpinPost,
    });
  }

  AdminUpdateGlobalFeed(
    endpoint: string,
    AdminPublicKey: string,
    PostHashHex: string,
    RemoveFromGlobalFeed: boolean
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminUpdateGlobalFeed, AdminPublicKey, {
      AdminPublicKey,
      PostHashHex,
      RemoveFromGlobalFeed,
    });
  }

  AdminRemoveNilPosts(endpoint: string, AdminPublicKey: string, NumPostsToSearch: number = 1000): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminRemoveNilPosts, AdminPublicKey, {
      AdminPublicKey,
      NumPostsToSearch,
    });
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

  AdminGetMempoolStats(endpoint: string, AdminPublicKey: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathAdminGetMempoolStats, AdminPublicKey, {
      AdminPublicKey,
    });
  }

  SwapIdentity(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    FromUsernameOrPublicKeyBase58Check: string,
    ToUsernameOrPublicKeyBase58Check: string,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.jwtPost(endpoint, BackendRoutes.RoutePathSwapIdentity, UpdaterPublicKeyBase58Check, {
      UpdaterPublicKeyBase58Check,
      FromUsernameOrPublicKeyBase58Check,
      ToUsernameOrPublicKeyBase58Check,
      MinFeeRateNanosPerKB,
      AdminPublicKey: UpdaterPublicKeyBase58Check,
    });

    return this.signAndSubmitTransaction(endpoint, request, UpdaterPublicKeyBase58Check);
  }

  SetUSDCentsToBitCloutReserveExchangeRate(
    endpoint: string,
    AdminPublicKey: string,
    USDCentsPerBitClout: number
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathSetUSDCentsToBitCloutReserveExchangeRate, AdminPublicKey, {
      AdminPublicKey,
      USDCentsPerBitClout,
    });
  }

  GetUSDCentsToBitCloutReserveExchangeRate(endpoint: string): Observable<any> {
    return this.get(endpoint, BackendRoutes.RoutePathGetUSDCentsToBitCloutReserveExchangeRate);
  }

  SetBuyBitCloutFeeBasisPoints(
    endpoint: string,
    AdminPublicKey: string,
    BuyBitCloutFeeBasisPoints: number
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathSetBuyBitCloutFeeBasisPoints, AdminPublicKey, {
      AdminPublicKey,
      BuyBitCloutFeeBasisPoints,
    });
  }

  GetBuyBitCloutFeeBasisPoints(endpoint: string): Observable<any> {
    return this.get(endpoint, BackendRoutes.RoutePathGetBuyBitCloutFeeBasisPoints);
  }

  UpdateGlobalParams(
    endpoint: string,
    UpdaterPublicKeyBase58Check: string,
    USDCentsPerBitcoin: number,
    CreateProfileFeeNanos: number,
    MinimumNetworkFeeNanosPerKB: number,
    MinFeeRateNanosPerKB: number
  ): Observable<any> {
    const request = this.jwtPost(endpoint, BackendRoutes.RoutePathUpdateGlobalParams, UpdaterPublicKeyBase58Check, {
      UpdaterPublicKeyBase58Check,
      USDCentsPerBitcoin,
      CreateProfileFeeNanos,
      MinimumNetworkFeeNanosPerKB,
      MinFeeRateNanosPerKB,
      AdminPublicKey: UpdaterPublicKeyBase58Check,
    });
    return this.signAndSubmitTransaction(endpoint, request, UpdaterPublicKeyBase58Check);
  }

  GetGlobalParams(endpoint: string, UpdaterPublicKeyBase58Check: string): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathGetGlobalParams, UpdaterPublicKeyBase58Check, {
      AdminPublicKey: UpdaterPublicKeyBase58Check,
    });
  }

  EvictUnminedBitcoinTxns(
    endpoint: string,
    UpdaterPublicKeyBase58Check,
    BitcoinTxnHashes: string[],
    DryRun: boolean
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathEvictUnminedBitcoinTxns, UpdaterPublicKeyBase58Check, {
      BitcoinTxnHashes,
      DryRun,
      AdminPublicKey: UpdaterPublicKeyBase58Check,
    });
  }

  GetFullTikTokURL(endpoint: string, TikTokShortVideoID: string): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetFullTikTokURL, {
      TikTokShortVideoID,
    }).pipe(
      map((res) => {
        return res.FullTikTokURL;
      })
    );
  }

  GetWyreWalletOrderForPublicKey(
    endpoint: string,
    AdminPublicKeyBase58Check,
    PublicKeyBase58Check: string,
    Username: string
  ): Observable<any> {
    return this.jwtPost(endpoint, BackendRoutes.RoutePathGetWyreWalletOrdersForPublicKey, AdminPublicKeyBase58Check, {
      AdminPublicKey: AdminPublicKeyBase58Check,
      PublicKeyBase58Check,
      Username,
    });
  }

  // Wyre
  GetWyreWalletOrderQuotation(
    endpoint: string,
    SourceAmount: number,
    Country: string,
    SourceCurrency: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetWyreWalletOrderQuotation, {
      SourceAmount,
      Country,
      SourceCurrency,
    });
  }

  GetWyreWalletOrderReservation(
    endpoint: string,
    ReferenceId: string,
    SourceAmount: number,
    Country: string,
    SourceCurrency: string
  ): Observable<any> {
    return this.post(endpoint, BackendRoutes.RoutePathGetWyreWalletOrderReservation, {
      ReferenceId,
      SourceAmount,
      Country,
      SourceCurrency,
    });
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
      return "BitClout is experiencing heavy load. Please try again in one minute.";
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf("not sufficient") >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf("with password") >= 0) {
        errorMessage = "The password you entered was incorrect.";
      } else if (errorMessage.indexOf("RuleErrorExistingStakeExceedsMaxAllowed") >= 0) {
        errorMessage = "Another staker staked to this post right before you. Please try again.";
      } else if (errorMessage.indexOf("already has stake") >= 0) {
        errorMessage = "You cannot stake to the same post more than once.";
      }
    }
    return errorMessage;
  }

  parseProfileError(err): string {
    if (err.status === 0) {
      return "BitClout is experiencing heavy load. Please try again in one minute.";
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf("not sufficient") >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf("with password") >= 0) {
        errorMessage = "The password you entered was incorrect.";
      } else if (errorMessage.indexOf("RuleErrorExistingStakeExceedsMaxAllowed") >= 0) {
        errorMessage = "Another staker staked to this profile right before you. Please try again.";
      } else if (errorMessage.indexOf("already has stake") >= 0) {
        errorMessage = "You cannot stake to the same profile more than once.";
      } else if (errorMessage.indexOf("RuleErrorProfileUsernameExists") >= 0) {
        errorMessage = "Sorry, someone has already taken this username.";
      } else if (errorMessage.indexOf("RuleErrorUserDescriptionLen") >= 0) {
        errorMessage = "Your description is too long.";
      } else if (errorMessage.indexOf("RuleErrorProfileUsernameTooLong") >= 0) {
        errorMessage = "Your username is too long.";
      } else if (errorMessage.indexOf("RuleErrorInvalidUsername") >= 0) {
        errorMessage =
          "Your username contains invalid characters. Usernames can only numbers, English letters, and underscores.";
      } else if (errorMessage.indexOf("RuleErrorCreatorCoinTransferInsufficientCoins") >= 0) {
        errorMessage = "You need more of your own creator coin to give a diamond of this level.";
      } else if (errorMessage.indexOf("RuleErrorInputSpendsPreviouslySpentOutput") >= 0) {
        errorMessage = "You're doing that a bit too quickly. Please wait a second or two and try again.";
      } else if (errorMessage.indexOf("RuleErrorCreatorCoinTransferBalanceEntryDoesNotExist") >= 0) {
        errorMessage = "You must own this creator coin before transferring it.";
      } else if (errorMessage.indexOf("RuleErrorCreatorCoinBuyMustTradeNonZeroBitCloutAfterFounderReward") >= 0) {
        errorMessage =
          "This creator has set their founder's reward to 100%. " +
          "You cannot buy creators that have set their founder's reward to 100%.";
      }
    }
    return errorMessage;
  }

  parseMessageError(err): string {
    if (err.status === 0) {
      return "BitClout is experiencing heavy load. Please try again in one minute.";
    }

    let errorMessage = JSON.stringify(err);
    if (err && err.error && err.error.error) {
      errorMessage = err.error.error;
      if (errorMessage.indexOf("not sufficient") >= 0) {
        errorMessage = `Your balance is insufficient.`;
      } else if (errorMessage.indexOf("with password") >= 0) {
        errorMessage = "The password you entered was incorrect.";
      } else if (errorMessage.indexOf("RuleErrorPrivateMessageSenderPublicKeyEqualsRecipientPublicKey") >= 0) {
        errorMessage = `You can't message yourself.`;
      } else if (errorMessage.indexOf("Problem decoding recipient") >= 0) {
        errorMessage = `The public key you entered is invalid. Check that you copied it in correctly.`;
      }
    }
    return errorMessage;
  }
}
