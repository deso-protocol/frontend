import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Location } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, ProfileEntryResponse } from "../../backend-api.service";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Subscription } from "rxjs";
import { dynamicMaxValidator } from "../../../lib/validators/dynamic-max-validator";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { AppRoutingModule } from "../../app-routing.module";
import { dynamicMinValidator } from "../../../lib/validators/dynamic-min-validator";
import * as _ from "lodash";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

@Component({
  selector: "trade-creator-form",
  templateUrl: "./trade-creator-form.component.html",
  styleUrls: ["./trade-creator-form.component.scss"],
})
export class TradeCreatorFormComponent implements OnInit, OnDestroy {
  // https://stackoverflow.com/questions/12475704/regular-expression-to-allow-only-integer-and-decimal
  // the original regex was /^[0-9]+([.][0-9]+)?$/, but I changed the first + to a *
  // so that we could recognize a number like ".1" as valid
  NUMBERS_ONLY_REGEX = /^[0-9]*([.][0-9]+)?$/;

  // the fees we obtain from the server aren't exact, so bump them up slightly
  // so that we don't accidentally underestimate (causing an error)
  FEE_LEEWAY_MULTIPLE = 1.1;

  // Leave some BitClout in the user's account so they can do normal site activity (like, post, etc)
  MIN_BITCLOUT_NANOS_TO_LEAVE_WHEN_BUYING_CREATOR_COINS = 100_000;

  @Input() creatorCoinTrade: CreatorCoinTrade;
  @Output() previewClicked = new EventEmitter();

  router: Router;
  appData: GlobalVarsService;

  // buy creator coin data
  bitCloutToSell: number;
  expectedCreatorCoinReturnedNanos: number = 0;

  // sell creator coin data
  creatorCoinToSell: number;
  expectedBitCloutReturnedNanos: number = 0;

  loggedInUserSubscription: Subscription;
  intervalsSet = [];
  isUpdatingAmounts: boolean = false;

  // Keep track of a sequence number for updateAmounts calls. This ensures
  // that we only display results from the most recent request (and thus don't
  // show the user incorrect response data from a previous ajax call).
  updateAmountsSequenceNumber = 0;

  _tradeVerbStringForOppositeAction() {
    return this.creatorCoinTrade.isBuyingCreatorCoin ? CreatorCoinTrade.SELL_VERB : CreatorCoinTrade.BUY_VERB;
  }

  _pathForOppositeAction() {
    if (this.creatorCoinTrade.isBuyingCreatorCoin) {
      return AppRoutingModule.sellCreatorPath(this.creatorCoinTrade.creatorProfile.Username);
    } else {
      return AppRoutingModule.buyCreatorPath(this.creatorCoinTrade.creatorProfile.Username);
    }
  }

  _allowPreviewClick() {
    if (this.creatorCoinTrade.isCreatorCoinTransfer()) {
      if (
        this.creatorCoinTrade.amount &&
        this.creatorCoinTrade.amount.valid &&
        this.creatorCoinTrade.transferRecipient &&
        this.creatorCoinTrade.transferRecipient.valid &&
        this.creatorCoinTrade.networkFeeNanos != 0 &&
        !this.isUpdatingAmounts
      ) {
        return true;
      } else {
        return false;
      }
    }

    // If we get here, this is a regular buy / sell.  Not a transfer.
    let amountIsValid = this.creatorCoinTrade.amount && this.creatorCoinTrade.amount.valid;
    let hasReturnAmount =
      this.creatorCoinTrade.totalCoinsMinted() > 0 || this.creatorCoinTrade.assetReturnedAmount() > 0;
    return amountIsValid && hasReturnAmount;
  }

  _onPreviewClicked() {
    if (!this._allowPreviewClick()) {
      return;
    }

    this.previewClicked.emit();
  }

  _setAssetToSellAmount() {
    if (this.creatorCoinTrade.isBuyingCreatorCoin) {
      // convert user-specified amount to bitclout
      // note: convertAmount takes nanos and returns nanos
      this.creatorCoinTrade.bitCloutToSell = this.creatorCoinTrade.convertAmount(
        this.creatorCoinTrade.amount.value /* input amount */,
        this.creatorCoinTrade.selectedCurrency /* input currency */,
        CreatorCoinTrade.BITCLOUT_CURRENCY_STRING /* target currency */
      );
    } else {
      // convert user-specified amount to creator coin
      // note: convertAmount takes nanos and returns nanos
      this.creatorCoinTrade.creatorCoinToSell = this.creatorCoinTrade.convertAmount(
        this.creatorCoinTrade.amount.value /* input amount */,
        this.creatorCoinTrade.selectedCurrency /* input currency */,
        CreatorCoinTrade.CREATOR_COIN_CURRENCY_STRING /* target currency */
      );
    }
  }

  _invalidateAndUpdateAmounts() {
    // Calling updateValueAndValidity() to force angular to revalidate the amount input
    // now that the currency has changed
    this.creatorCoinTrade.amount.updateValueAndValidity();

    this._executeUpdateAmounts();
  }

  // This submits the BuyOrSellCreatorCoin request. We want our debouncedExecuteUpdateAmounts
  // function to call this only once, after the user finishes typing
  _executeUpdateAmounts() {
    this.isUpdatingAmounts = true;
    this._resetTransferErrors();

    // Re-validate that everything is ok before submitting. Without this, we could have a
    // situation like:
    //   - amount is valid
    //   - debounced _executeUpdateAmounts call is queued up
    //   - user changes UI to an invalid amount
    //   - the debounced _executeUpdateAmounts is called, but now the amount is invalid
    let success = this._beforeExecuteUpdateAmounts();
    if (!success) {
      this.isUpdatingAmounts = false;
      return;
    }

    // Increment the current sequence number
    this.updateAmountsSequenceNumber += 1;
    let currentSequenceNumber = this.updateAmountsSequenceNumber;

    if (this.creatorCoinTrade.isCreatorCoinTransfer()) {
      // Hit the backend with "Broadcast=false" to calculate network fees.
      this.backendApi
        .TransferCreatorCoin(
          this.appData.localNode,
          this.appData.loggedInUser.PublicKeyBase58Check /*SenderPublicKeyBase58Check*/,
          this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check /*CreatorPublicKeyBase58Check*/,
          this.creatorCoinTrade.transferRecipient.value.PublicKeyBase58Check /*ReceiverPublicKeyBase58Check*/,
          this.creatorCoinTrade.amount.value * 1e9 /*CreatorCoinToTransferNanos*/,
          this.appData.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/,
          false
        )
        .subscribe(
          (response) => {
            // Ensure that the current sequence number matches the global sequence number,
            // since we only want to display results from the most recent request
            if (currentSequenceNumber != this.updateAmountsSequenceNumber) {
              return;
            }

            this.creatorCoinTrade.networkFeeNanos = response.FeeNanos;
            this.isUpdatingAmounts = false;
          },
          (err) => {
            this.isUpdatingAmounts = false;
            console.error(err);
            // If we didn't find the profile, show the 'couldn't find username' error text.
            if (err.error?.error?.indexOf("TransferCreatorCoin: Problem getting profile for username") >= 0) {
              this.creatorCoinTrade.showUsernameError = true;
            } else if (err.error?.error?.indexOf("TransferCreatorCoin: Problem decoding receiver public key") >= 0) {
              this.creatorCoinTrade.showPubKeyError = true;
            } else if (err.error?.error?.indexOf("TransferCreatorCoin: Sender and receiver cannot be the same") >= 0) {
              this.creatorCoinTrade.showCannotSendToSelfError = true;
            } else {
              this.appData._alertError(this.backendApi.parseProfileError(err));
            }
          }
        );
    } else {
      // obtain amounts from backend without actually broadcasting
      this.backendApi
        .BuyOrSellCreatorCoin(
          this.appData.localNode,
          this.appData.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
          this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check /*CreatorPublicKeyBase58Check*/,
          this.creatorCoinTrade.operationType() /*OperationType*/,
          this.creatorCoinTrade.bitCloutToSell * 1e9 /*BitCloutToSellNanos*/,
          this.creatorCoinTrade.creatorCoinToSell * 1e9 /*CreatorCoinToSellNanos*/,
          0 /*BitCloutToAddNanos*/,
          0 /*MinBitCloutExpectedNanos*/,
          0 /*MinCreatorCoinExpectedNanos*/,

          this.appData.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/,
          false
        )
        .subscribe(
          (response) => {
            // Ensure that the current sequence number matches the global sequence number,
            // since we only want to display results from the most recent request
            if (currentSequenceNumber != this.updateAmountsSequenceNumber) {
              return;
            }

            this.creatorCoinTrade.expectedCreatorCoinReturnedNanos = response.ExpectedCreatorCoinReturnedNanos || 0;
            this.creatorCoinTrade.expectedBitCloutReturnedNanos = response.ExpectedBitCloutReturnedNanos || 0;
            this.creatorCoinTrade.expectedFounderRewardNanos = response.FounderRewardGeneratedNanos || 0;
            this.isUpdatingAmounts = false;
          },
          (err) => {
            this.isUpdatingAmounts = false;
            // TODO: creator coin buys: rollbar
            console.error(err);
            this.appData._alertError(this.backendApi.parseProfileError(err));
          }
        );
    }
  }

  _resetTransferErrors() {
    this.creatorCoinTrade.showUsernameError = false;
    this.creatorCoinTrade.showPubKeyError = false;
    this.creatorCoinTrade.showCannotSendToSelfError = false;
  }

  // Validations + setup before we send the BuyOrSellCreatorCoin request to the server
  // Returns false if execution should halt, true if it should proceed
  //
  // This was moved out of _executeUpdateAmounts() into a separate function so that
  // we could call it every time the amount changes
  _beforeExecuteUpdateAmounts() {
    this._resetTransferErrors();
    this.creatorCoinTrade.clearAllFields();

    // don't submit invalid amounts
    if (!this.creatorCoinTrade.amount || !this.creatorCoinTrade.amount.valid) {
      return false;
    }

    if (this.creatorCoinTrade.isCreatorCoinTransfer() && !this.creatorCoinTrade.transferRecipient.valid) {
      return false;
    }

    this._setAssetToSellAmount();

    // If we get to this point and there are no amounts, there is nothing to update.
    if (this.creatorCoinTrade.bitCloutToSell === 0 && this.creatorCoinTrade.creatorCoinToSell === 0) {
      return false;
    }

    return true;
  }

  _maxButtonClicked() {
    this.creatorCoinTrade.amount.setValue(this._maxAmount().toFixed(9));
  }

  _maxAmount() {
    if (this.creatorCoinTrade == null || this.creatorCoinTrade.selectedCurrency == null) {
      return null;
    }

    let balance;
    if (this.creatorCoinTrade.currentFeeForSellNanos == null) {
      // if we don't have the fee yet, just pretend the max is the user's balance
      // this should generally only happen when we can't obtain the fee (which only happens
      // when the user has 0 balance)

      balance = this.creatorCoinTrade.assetToSellBalance();
    } else {
      balance = this.creatorCoinTrade.assetToSellBalance() - this.creatorCoinTrade.currentFeeForSellNanos / 1e9;
    }

    if (this.creatorCoinTrade.isBuyingCreatorCoin) {
      // if buying creator coin, leave some bitclout left over so that people can continue
      // to use the site (like, post, sell creator coins, etc) (i.e. don't drain the full balance)
      balance -= this.MIN_BITCLOUT_NANOS_TO_LEAVE_WHEN_BUYING_CREATOR_COINS / 1e9;
    }

    let assetToSellCurrency;
    if (this.creatorCoinTrade.isBuyingCreatorCoin) {
      assetToSellCurrency = CreatorCoinTrade.BITCLOUT_CURRENCY_STRING;
    } else {
      assetToSellCurrency = CreatorCoinTrade.CREATOR_COIN_CURRENCY_STRING;
    }

    let maxAmount = this.creatorCoinTrade.convertAmount(
      balance /* input amount */,
      assetToSellCurrency /* input currency */,
      this.creatorCoinTrade.selectedCurrency /* target currency */
    );

    // ensure maxAmount is at least 0
    maxAmount = Math.max(0, maxAmount);

    return parseFloat(maxAmount.toFixed(9));
  }

  _minAmount() {
    return 0;
  }

  _setUpAmountField() {
    this.creatorCoinTrade.amount = new FormControl(null, [
      Validators.required,
      Validators.pattern(this.NUMBERS_ONLY_REGEX),
      dynamicMinValidator(() => {
        return this._minAmount();
      }, false /* inclusive */),
      dynamicMaxValidator(() => {
        return this._maxAmount();
      }, true /*inclusive*/),
    ]);

    // if the user has set the amount previously (e.g. because he clicked review and then went
    // back), populate the amount
    let assetToSellAmount = this.creatorCoinTrade.assetToSellAmount();
    if (assetToSellAmount != 0) {
      let amount = this.creatorCoinTrade.convertAmount(
        assetToSellAmount /* input amount */,
        this.creatorCoinTrade.assetToSellCurrency() /* input currency */,
        this.creatorCoinTrade.selectedCurrency /* target currency */
      );
      this.creatorCoinTrade.amount.setValue(amount);
    }

    // Wait 700 ms before calling _executeUpdateAmounts to allow the user to finish typing.
    // This makes the UX a little slower, but reduces server calls.
    let debouncedExecuteUpdateAmounts = _.debounce(_.bind(this._executeUpdateAmounts, this), 700);
    let onValueChange = () => {
      // We run _beforeExecuteUpdateAmounts here so we don't debounce if unnecessary.
      if (!this._beforeExecuteUpdateAmounts()) return;

      // We start the updating spinner here so that it begins before the debounce period.
      this.isUpdatingAmounts = true;
      debouncedExecuteUpdateAmounts();
    };
    this.creatorCoinTrade.amount.valueChanges.subscribe(() => {
      onValueChange();
    });
    this.creatorCoinTrade.transferRecipient.valueChanges.subscribe(() => {
      onValueChange();
    });
  }

  constructor(
    private globalVars: GlobalVarsService,
    private route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
    private location: Location
  ) {
    this.appData = globalVars;
    this.router = _router;
  }

  ngOnInit() {
    // Populate a default currency if it's not already set. selectedCurrency may be already set
    // if the user is going back from the Preview screen.
    //
    // Note: it's important that we set a selectedCurrency before we call _setUpAmountField(),
    // which depends on a currency being set
    if (!this.creatorCoinTrade.selectedCurrency) {
      this.creatorCoinTrade.selectedCurrency = this.creatorCoinTrade.defaultCurrency();
    }

    this._setUpAmountField();

    // important to update amounts in case we're returning to this view due to slippage error
    this._executeUpdateAmounts();

    // This is a hack. If the user is selling creator coins, gets to the preview screen, and clicks
    // back, updateAmounts (above) early-returns because the amount.valid is mysteriously false.
    // I don't know why it's false, but if we call it again a few ms later, it works, so just
    // doing this for now.
    window.setTimeout(() => {
      this._executeUpdateAmounts();
    }, 10);

    if (this.creatorCoinTrade.isBuyingCreatorCoin) {
      // We poll for the fee because we need to wait for feeRateBitCloutPerKB
      // to be set. If we don't wait for this, things get messed up.
      let isFetching = false;
      const pollForFee = setInterval(() => {
        if (this.appData.feeRateBitCloutPerKB == 0 || isFetching) {
          // Do nothing. feeRateBitCloutPerKB hasn't been set yet. If we ask for a fee now,
          // we'll get a misleading value.
          return;
        }

        // This is a hack to get an estimate of the current fee
        isFetching = true;
        this.backendApi
          .SendBitCloutPreview(
            this.appData.localNode,
            this.appData.loggedInUser.PublicKeyBase58Check,
            this.appData.loggedInUser.PublicKeyBase58Check,
            // A negative amount causes the max value to be returned as the spend amount.
            -1,
            this.appData.feeRateBitCloutPerKB * 1e9 /* min fee rate */
          )
          .subscribe(
            (response: any) => {
              isFetching = false;
              clearInterval(pollForFee);
              this.creatorCoinTrade.currentFeeForSellNanos = response.FeeNanos * this.FEE_LEEWAY_MULTIPLE;
            },
            (error) => {
              isFetching = false;
              clearInterval(pollForFee);
              // TODO: creator coin buys: rollbar
              console.error(error);
            }
          );
      }, 100);
    } else {
      // if selling a creator coin, the fee is baked in, so for the purposes
      // of this component (computing the max), it's 0
      this.creatorCoinTrade.currentFeeForSellNanos = 0;
      if (
        this.globalVars.loggedInUser.PublicKeyBase58Check ===
          this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check &&
        !this.creatorCoinTrade.isCreatorCoinTransfer()
      ) {
        const hodlersCount = this.globalVars.loggedInUser.UsersWhoHODLYouCount;
        SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          title: "Warning!",
          html: `You have ${hodlersCount} supporter${hodlersCount > 1 ? "s" : ""}  who own${
            hodlersCount > 1 ? "" : "s"
          } your coin. If you sell, they will be notified. Are you sure?`,
          showCancelButton: true,
          showDenyButton: true,
          showConfirmButton: false,
          icon: "warning",
          denyButtonText: "Proceed",
          cancelButtonText: "Go Back",
          customClass: {
            denyButton: "btn btn-light",
            cancelButton: "btn btn-light no",
          },
          reverseButtons: true,
        }).then((response: any) => {
          if (response.isDismissed) {
            this.location.back();
          }
        });
      }
    }
  }

  ngOnDestroy() {
    for (let ii = 0; ii < this.intervalsSet.length; ii++) {
      clearInterval(this.intervalsSet[ii]);
    }

    if (this.loggedInUserSubscription) {
      this.loggedInUserSubscription.unsubscribe();
    }
  }

  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    this.creatorCoinTrade.transferRecipient.setValue(creator);
  }
}
