import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { FollowService } from "../../../lib/services/follow/follow.service";
import { of } from "rxjs";

@Component({
  selector: "trade-creator-preview",
  templateUrl: "./trade-creator-preview.component.html",
  styleUrls: ["./trade-creator-preview.component.scss"],
})
export class TradeCreatorPreviewComponent implements OnInit {
  // orders will execute as long as the value doesn't slip by more than 25%
  ALLOWED_SLIPPAGE_PERCENT = 75;

  BITCLOUT_RECEIVED_LESS_THAN_MIN_SLIPPAGE_ERROR = "RuleErrorBitCloutReceivedIsLessThanMinimumSetBySeller";
  CREATOR_COIN_RECEIVED_LESS_THAN_MIN_SLIPPAGE_ERROR = "RuleErrorCreatorCoinLessThanMinimumSetByUser";

  @Input() creatorCoinTrade: CreatorCoinTrade;
  @Input() inTutorial: boolean = false;

  @Output() slippageError = new EventEmitter();
  @Output() tradeExecuted = new EventEmitter();
  @Output() backButtonClicked = new EventEmitter();

  router: Router;
  appData: GlobalVarsService;
  creatorCoinTradeBeingCalled: boolean = false;
  showHighLoadWarning: boolean = false;

  _onTradeExecuted() {
    this.tradeExecuted.emit();
  }

  _sanityCheckBuyOrSell() {
    // Sanity check that only one of bitcloutToSell and creatorCoinToSell is nonzero
    // I've never seen this happen, but just trying to be careful since user money is involved,
    // and if it happens, I'd like to know about it so we can fix root cause
    let bitCloutToSell = this.creatorCoinTrade.bitCloutToSell || 0;
    let creatorCoinToSell = this.creatorCoinTrade.creatorCoinToSell || 0;
    if (bitCloutToSell > 0 && creatorCoinToSell > 0) {
      console.error(`bitCloutToSell ${bitCloutToSell} and creatorCoinToSell ${creatorCoinToSell} are both > 0`);
      // TODO: creator coin buys: rollbar

      // in case that happened, as a hack, reset one of them to 0 ... just so the user doesn't
      // get weird behavior
      if (this.creatorCoinTrade.isBuyingCreatorCoin) {
        this.creatorCoinTrade.creatorCoinToSell = 0;
      } else {
        this.creatorCoinTrade.bitCloutToSell = 0;
      }
    }
  }

  _tradeCreatorCoin() {
    if (this.creatorCoinTrade.isCreatorCoinTransfer()) {
      this._transferCreatorCoin();
    } else {
      this._buyOrSellCreatorCoin();
    }
  }

  _buyOrSellCreatorCoin() {
    // don't submit multiple requests
    if (this.creatorCoinTradeBeingCalled) {
      return;
    }

    this._sanityCheckBuyOrSell();

    this.creatorCoinTradeBeingCalled = true;

    const minBitCloutExpectedNanos =
      this.creatorCoinTrade.expectedBitCloutReturnedNanos * (this.ALLOWED_SLIPPAGE_PERCENT / 100);

    const minCreatorCoinExpectedNanos =
      this.creatorCoinTrade.expectedCreatorCoinReturnedNanos * (this.ALLOWED_SLIPPAGE_PERCENT / 100);

    // If we haven't completed the request in 20 seconds, show the high load warning
    window.setTimeout(() => {
      if (this.creatorCoinTradeBeingCalled) {
        this.showHighLoadWarning = true;
      }
    }, 20000);

    this.backendApi
      .BuyOrSellCreatorCoin(
        this.appData.localNode,
        this.appData.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check /*CreatorPublicKeyBase58Check*/,
        this.creatorCoinTrade.operationType() /*OperationType*/,
        this.creatorCoinTrade.bitCloutToSell * 1e9 /*BitCloutToSellNanos*/,
        this.creatorCoinTrade.creatorCoinToSell * 1e9 /*CreatorCoinToSellNanos*/,
        0 /*BitCloutToAddNanos*/,
        minBitCloutExpectedNanos /*MinBitCloutExpectedNanos*/,
        minCreatorCoinExpectedNanos /*MinCreatorCoinExpectedNanos*/,

        this.appData.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/,
        true,
        this.inTutorial
      )
      .subscribe(
        (response) => {
          const {
            ExpectedBitCloutReturnedNanos,
            ExpectedCreatorCoinReturnedNanos,
            SpendAmountNanos,
            TotalInputNanos,
            ChangeAmountNanos,
            FeeNanos,
          } = response;
          this.globalVars.logEvent("coins : trade", {
            Creator: this.creatorCoinTrade.creatorProfile.Username,
            Operation: this.creatorCoinTrade.operationType(),
            ExpectedBitCloutReturnedNanos,
            ExpectedCreatorCoinReturnedNanos,
            SpendAmountNanos,
            TotalInputNanos,
            ChangeAmountNanos,
            FeeNanos,
          });

          this.creatorCoinTrade.expectedCreatorCoinReturnedNanos = ExpectedCreatorCoinReturnedNanos || 0;
          this.creatorCoinTrade.expectedBitCloutReturnedNanos = ExpectedBitCloutReturnedNanos || 0;

          const observable =
            this.creatorCoinTrade.followCreator &&
            !this.followService._isLoggedInUserFollowing(this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check) &&
            this.appData.loggedInUser.PublicKeyBase58Check !==
              this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check &&
            this.creatorCoinTrade.tradeType === CreatorCoinTrade.BUY_VERB
              ? this.followService._toggleFollow(true, this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check)
              : of(null).subscribe();
          observable.add(() => {
            this.appData.updateEverything(
              response.TxnHashHex,
              this._creatorCoinSuccess,
              this._creatorCoinFailure,
              this
            );
          });
        },
        (response) => {
          this._handleRequestErrors(response);
        }
      );
  }

  _transferCreatorCoin() {
    // don't submit multiple requests
    if (this.creatorCoinTradeBeingCalled) {
      return;
    }
    this.creatorCoinTradeBeingCalled = true;

    // If we haven't completed the request in 20 seconds, show the high load warning
    window.setTimeout(() => {
      if (this.creatorCoinTradeBeingCalled) {
        this.showHighLoadWarning = true;
      }
    }, 20000);

    // Broadcast the transaction.
    this.backendApi
      .TransferCreatorCoin(
        this.appData.localNode,
        this.appData.loggedInUser.PublicKeyBase58Check /*SenderPublicKeyBase58Check*/,
        this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check /*CreatorPublicKeyBase58Check*/,
        this.creatorCoinTrade.transferRecipient.value.PublicKeyBase58Check /*ReceiverPublicKeyBase58Check*/,
        this.creatorCoinTrade.amount.value * 1e9 /*CreatorCoinToTransferNanos*/,
        this.appData.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/,
        true
      )
      .subscribe(
        (response) => {
          const { SpendAmountNanos, TotalInputNanos, ChangeAmountNanos, FeeNanos } = response;
          this.globalVars.logEvent("coins : transfer", {
            Creator: this.creatorCoinTrade.creatorProfile.Username,
            SenderPublicKeyBase58Check: this.appData.loggedInUser.PublicKeyBase58Check,
            ReceiverUsernameOrPublicKeyBase58Check: this.creatorCoinTrade.transferRecipient.value.PublicKeyBase58Check,
            CreatorCoinToTransferNanos: this.creatorCoinTrade.amount.value * 1e9,
            SpendAmountNanos,
            TotalInputNanos,
            ChangeAmountNanos,
            FeeNanos,
          });

          // This will update the user's balance.
          this.appData.updateEverything(response.TxnHashHex, this._creatorCoinSuccess, this._creatorCoinFailure, this);
        },
        (err) => {
          this._handleRequestErrors(err);
        }
      );
  }

  _handleRequestErrors(response: any) {
    this.creatorCoinTradeBeingCalled = false;
    // CloudFlare rate limiting doesn't return an Access-Allow-Control-Origin header so the browser
    // barfs and returns an unknown error code which has a status of 0
    if (response.status === 0) {
      return this.appData._alertError("BitClout is under heavy load. Please try again in one minute.");
    }

    const errorMessage = response.error.error;
    const parsedError = this.backendApi.parseProfileError(response);

    const hasSlippageError =
      errorMessage.includes(this.BITCLOUT_RECEIVED_LESS_THAN_MIN_SLIPPAGE_ERROR) ||
      errorMessage.includes(this.CREATOR_COIN_RECEIVED_LESS_THAN_MIN_SLIPPAGE_ERROR);

    this.globalVars.logEvent("coins : trade : error", { parsedError, hasSlippageError });

    if (hasSlippageError) {
      this.slippageError.emit();
    } else {
      this.appData._alertError(parsedError);
    }
  }

  _creatorCoinSuccess = (comp: any) => {
    comp.appData.celebrate();
    comp.creatorCoinTradeBeingCalled = false;
    comp.showHighLoadWarning = false;
    this._onTradeExecuted();
  };

  _creatorCoinFailure = (comp: any) => {
    comp.creatorCoinTradeBeingCalled = false;
    comp.showHighLoadWarning = false;
    comp.appData._alertError("Transaction broadcast successfully but read node timeout exceeded. Please refresh.");
  };

  constructor(
    private globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private followService: FollowService
  ) {
    this.appData = globalVars;
    this.router = _router;
  }

  ngOnInit() {
    window.scroll(0, 0);
  }
}
