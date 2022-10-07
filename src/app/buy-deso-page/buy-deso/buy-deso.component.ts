import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';
import { BackendApiService, BackendRoutes } from '../../backend-api.service';
import { sprintf } from 'sprintf-js';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SwalHelper } from '../../../lib/helpers/swal-helper';
import Swal from 'sweetalert2';
import { IdentityService } from '../../identity.service';
import { WyreService } from '../../../lib/services/wyre/wyre';

class Messages {
  static INCORRECT_PASSWORD = `The password you entered was incorrect.`;
  static INSUFFICIENT_BALANCE = `Your balance is insufficient to process the transaction.`;
  static CONNECTION_PROBLEM = `We had a problem processing your transaction. Please wait a few minutes and try again.`;
  static UNKOWN_PROBLEM = `There was a weird problem with the transaction. Debug output: %s`;

  static CONFIRM_BUY_deso = `Are you ready to exchange %s Bitcoin with a fee of %s Bitcoin for %s DeSo?`;
  static ZERO_deso_ERROR = `You must purchase a non-zero amount DeSo`;
  static NEGATIVE_deso_ERROR = `You must purchase a non-negative amount of DeSo`;
}

@Component({
  selector: 'buy-deso',
  templateUrl: './buy-deso.component.html',
  styleUrls: ['./buy-deso.component.scss'],
})
export class BuyDeSoComponent implements OnInit {
  appData: GlobalVarsService;

  waitingOnTxnConfirmation = false;
  queryingBitcoinAPI = false;
  wyreService: WyreService;
  showBuyComplete: boolean = false;

  BuyDeSoComponent = BuyDeSoComponent;

  static BUY_WITH_MEGASWAP = 'Buy with Crypto';
  static BUY_WITH_USD = 'Buy with USD';
  static BUY_WITH_BTC = 'Buy with BTC';
  static BUY_WITH_ETH = 'Buy with ETH';

  buyTabs = [BuyDeSoComponent.BUY_WITH_MEGASWAP];
  activeTab = BuyDeSoComponent.BUY_WITH_MEGASWAP;

  constructor(
    public ref: ChangeDetectorRef,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private identityService: IdentityService,
    private route: ActivatedRoute,
    private router: Router,
    private httpClient: HttpClient
  ) {
    this.appData = globalVars;
    this.route.queryParams.subscribe((params: Params) => {
      if (params.btc) {
        this.activeTab = BuyDeSoComponent.BUY_WITH_BTC;
        this.router.navigate([], { queryParams: {} });
      }
    });
  }

  btcDepositAddress(): string {
    const pubKey = this.appData.loggedInUser.PublicKeyBase58Check;
    return this.identityService.identityServiceUsers[pubKey]?.btcDepositAddress;
  }

  onBuyMoreDeSoClicked() {
    this.showBuyComplete = false;
    this._queryBitcoinAPI();
  }

  stepOneTooltip() {
    return (
      'DESO can be purchased in just a few minutes using Bitcoin.\n\n' +
      'To get started, simply send Bitcoin to your deposit address below. Note that deposits should show up ' +
      'within thirty seconds or so but sometimes, for various technical reasons, it can take up to an hour ' +
      '(though this should be extremely rare).\n\n' +
      "Once you've deposited Bitcoin, you can swap it for DESO in step two below. If it's your first " +
      'time doing this, we recommend starting with a small test amount of Bitcoin to get comfortable with the flow.'
    );
  }

  depositBitcoinTooltip() {
    return 'Send Bitcoin to this address so that you can swap it for DESO in step two below.';
  }

  minDepositTooltip() {
    return (
      'This is the minimum amount required to cover the Bitcoin ' +
      'network fees associated with your purchase. We would love to make this ' +
      'lower, but if we did then the Bitcoin network would reject your transaction.'
    );
  }

  withdrawBitcoinTooltip() {
    return (
      'If you send too much Bitcoin to your deposit address and need to get it back, you ' +
      'can access the Bitcoin in this address by importing your DeSo seed phrase into most standard Bitcoin wallets ' +
      "like Electrum and choosing m/44'/0'/0'/0/0 as your derivation path. This works because your DeSo seed phrase is " +
      "what's used to generate your Bitcoin deposit address."
    );
  }

  balanceUpdateTooltip() {
    return (
      'Normally, when you send Bitcoin to the deposit address, it will show up instantly. ' +
      'However, it can take up to an hour in rare cases depending on where you send it from.'
    );
  }

  bitcoinNetworkFeeTooltip() {
    return (
      'The process of exchanging Bitcoin for DeSo requires posting a transaction to ' +
      'the Bitcoin blockchain. For this reason, we must add a network fee to ' +
      'incentivize miners to process the transaction.'
    );
  }

  _extractBurnError(err: any): string {
    if (err.error != null && err.error.error != null) {
      // Is it obvious yet that I'm not a frontend gal?
      // TODO: Error handling between BE and FE needs a major redesign.
      let rawError = err.error.error;
      if (rawError.includes('password')) {
        return Messages.INCORRECT_PASSWORD;
      } else if (rawError.includes('not sufficient')) {
        return Messages.INSUFFICIENT_BALANCE;
      } else if (rawError.includes('so high')) {
        return `The amount of Bitcoin you've deposited is too low. Please deposit at least ${(
          (this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB * 0.3) /
          1e8
        ).toFixed(4)} Bitcoin.`;
      } else if (rawError.includes('total=0')) {
        return `You must purchase a non-zero amount of DeSo.`;
      } else if (rawError.includes('You must burn at least .0001 Bitcoins')) {
        return `You must exchange at least  ${(
          (this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB * 0.3) /
          1e8
        ).toFixed(4)} Bitcoin.`;
      } else {
        return rawError;
      }
    }
    if (err.status != null && err.status != 200) {
      return Messages.CONNECTION_PROBLEM;
    }
    // If we get here we have no idea what went wrong so just return the
    // errorString.
    return sprintf(Messages.UNKOWN_PROBLEM, JSON.stringify(err));
  }

  buyDeSoFields = {
    desoToBuy: '',
    bitcoinToExchange: '',
    bitcoinTransactionFeeRateSatoshisPerKB: 1000 * 1000,
    bitcoinTotalTransactionFeeSatoshis: '0',
    error: '',
  };

  _updateBitcoinFee(bitcoinToExchange: number): Promise<any> {
    if (
      this.appData == null ||
      this.appData.loggedInUser == null ||
      this.appData.latestBitcoinAPIResponse == null
    ) {
      SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: 'error',
        title: `Oops...`,
        html: `Please wait for at least one balance update before hitting this button.`,
        showConfirmButton: true,
        showCancelButton: false,
        focusConfirm: true,
        customClass: {
          confirmButton: 'btn btn-light',
          cancelButton: 'btn btn-light no',
        },
      });

      return;
    }

    // Update the total fee to account for the extra Bitcoin.
    return this.backendApi
      .ExchangeBitcoin(
        this.appData.localNode,
        this.appData.latestBitcoinAPIResponse,
        this.btcDepositAddress(),
        this.appData.loggedInUser.PublicKeyBase58Check,
        Math.floor(bitcoinToExchange * 1e8),
        Math.floor(this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB),
        false
      )
      .toPromise()
      .then(
        (res) => {
          if (res == null || res.FeeSatoshis == null) {
            this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis = '0';
            this.buyDeSoFields.error = Messages.UNKOWN_PROBLEM;
            return null;
          }
          this.buyDeSoFields.error = '';
          this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis =
            res.FeeSatoshis;
          return res;
        },
        (err) => {
          console.error('Problem updating Bitcoin fee Satoshis Per KB', err);
          this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis = '0';
          this.buyDeSoFields.error = this._extractBurnError(err);
          return null;
        }
      );
  }

  stringify(x: any): any {
    return JSON.stringify(x);
  }

  _numPendingTxns(txnObj) {
    if (txnObj == null) {
      return 0;
    }
    return Object.keys(txnObj).length;
  }

  _clickBuyDeSo() {
    if (this.appData == null || this.appData.loggedInUser == null) {
      return;
    }

    if (
      this.buyDeSoFields.desoToBuy == '' ||
      parseFloat(this.buyDeSoFields.desoToBuy) === 0
    ) {
      this.appData._alertError(Messages.ZERO_deso_ERROR);
      return;
    }
    if (parseFloat(this.buyDeSoFields.desoToBuy) < 0) {
      this.appData._alertError(Messages.NEGATIVE_deso_ERROR);
      return;
    }

    if (this.buyDeSoFields.error != null && this.buyDeSoFields.error !== '') {
      this.appData._alertError(this.buyDeSoFields.error);
      return;
    }

    let confirmBuyDeSoString = sprintf(
      Messages.CONFIRM_BUY_deso,
      this.buyDeSoFields.bitcoinToExchange,
      (
        parseFloat(this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis) / 1e8
      ).toFixed(8),
      this.buyDeSoFields.desoToBuy
    );

    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: 'Are you ready?',
      html: confirmBuyDeSoString,
      showCancelButton: true,
      customClass: {
        confirmButton: 'btn btn-light',
        cancelButton: 'btn btn-light no',
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        // Execute the buy
        this.waitingOnTxnConfirmation = true;
        return this.backendApi
          .ExchangeBitcoin(
            this.appData.localNode,
            this.appData.latestBitcoinAPIResponse,
            this.btcDepositAddress(),
            this.appData.loggedInUser.PublicKeyBase58Check,
            Math.floor(parseFloat(this.buyDeSoFields.bitcoinToExchange) * 1e8),
            Math.floor(
              this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB
            ),
            true
          )
          .toPromise()
          .then(
            (res) => {
              if (res == null || res.FeeSatoshis == null) {
                this.globalVars.logEvent('bitpop : buy : error');
                this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis = '0';
                this.buyDeSoFields.error = Messages.UNKOWN_PROBLEM;
                return null;
              }
              this.globalVars.logEvent('bitpop : buy', this.buyDeSoFields);

              // Reset all the form fields and run a BitcoinAPI update
              this.buyDeSoFields.error = '';
              this.buyDeSoFields.desoToBuy = '';
              this.buyDeSoFields.bitcoinToExchange = '';
              this.buyDeSoFields.bitcoinTotalTransactionFeeSatoshis = '0';
              // Update the BitcoinAPIResponse
              this.appData.latestBitcoinAPIResponse = null;

              // This will update the balance and a bunch of other things.
              this.appData.updateEverything(
                res.DeSoTxnHashHex,
                this._clickBuyDeSoSuccess,
                this._clickBuyDeSoSuccessButTimeout,
                this
              );

              return res;
            },
            (err) => {
              this.globalVars.logEvent('bitpop : buy : error');
              this._clickBuyDeSoFailure(this, this._extractBurnError(err));
              return null;
            }
          );
      }
    });
  }

  _clickBuyDeSoSuccess(comp: BuyDeSoComponent) {
    comp.waitingOnTxnConfirmation = false;
    comp.appData.celebrate();
    comp.showBuyComplete = true;
    comp.ref.detectChanges();
  }

  _clickBuyDeSoSuccessButTimeout(comp: BuyDeSoComponent) {
    this.appData.logEvent('bitpop : buy : read-timeout');
    comp.waitingOnTxnConfirmation = false;
    let errString =
      'Your DeSo purchase was successfully broadcast. Due to high load' +
      ' your balance may take up to half an hour to show up in your wallet. Please ' +
      " check back and hit the 'help' button if you have any problems.";
    comp.appData._alertSuccess(errString);
  }

  _clickBuyDeSoFailure(comp: BuyDeSoComponent, errString: string) {
    comp.waitingOnTxnConfirmation = false;
    // The error about "replace by fee" has a link in it, and we want that link
    // to render. There is no risk of injection here.
    if (errString && errString.indexOf('replace by fee') >= 0) {
      // TODO: We should add some kind of htmlSafe attribute or something to
      // do this rather than creating a potentially-insecure if statement as
      // we do here.
      Swal.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: 'info',
        title: `Almost there!`,
        html: errString,
        showConfirmButton: true,
        focusConfirm: true,
        customClass: {
          confirmButton: 'btn btn-light',
          cancelButton: 'btn btn-light no',
        },
      });
      return;
    }
    comp.appData._alertError(errString);
  }

  _clickMaxDeSo() {
    this._updateBitcoinFee(-1).then(
      (res) => {
        if (res == null || res.BurnAmountSatoshis == null) {
          return;
        }

        // The fee should have been updated by the time we get here so
        // just update the Bitcoin and DeSo amounts.
        this.buyDeSoFields.bitcoinToExchange = (
          res.BurnAmountSatoshis / 1e8
        ).toFixed(8);
        this._updateBitcoinToExchange(this.buyDeSoFields.bitcoinToExchange);
      },
      (err) => {
        // The error should have been set by the time we get here.
      }
    );
  }

  _computeSatoshisToBurnGivenDeSoNanos(amountNanos: number) {
    if (!this.appData.satoshisPerDeSoExchangeRate) {
      SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: 'error',
        title: `Oops...`,
        html: `We're still fetching some exchange rate data. Try again in about ten seconds.`,
        showConfirmButton: true,
        showCancelButton: false,
        focusConfirm: true,
        customClass: {
          confirmButton: 'btn btn-light',
          cancelButton: 'btn btn-light no',
        },
      });

      return 0;
    }

    const amountDESO = amountNanos / 1e9;

    return (
      amountDESO *
      (this.globalVars.satoshisPerDeSoExchangeRate *
        (1 + this.globalVars.BuyDeSoFeeBasisPoints / (100 * 100)))
    );
  }

  _computeNanosToCreateGivenSatoshisToBurn(satoshisToBurn: number): number {
    // Account for the case where we haven't fetched the protocol exchange rate yet.
    // For some reason this was taking 20 seconds in prod...
    if (!this.appData.satoshisPerDeSoExchangeRate) {
      SwalHelper.fire({
        target: this.globalVars.getTargetComponentSelector(),
        icon: 'error',
        title: `Oops...`,
        html: `We're still fetching some exchange rate data. Try again in about ten seconds.`,
        showConfirmButton: true,
        showCancelButton: false,
        focusConfirm: true,
        customClass: {
          confirmButton: 'btn btn-light',
          cancelButton: 'btn btn-light no',
        },
      });

      return 0;
    }
    return (
      (satoshisToBurn /
        (this.globalVars.satoshisPerDeSoExchangeRate *
          (1 + this.globalVars.BuyDeSoFeeBasisPoints / (100 * 100)))) *
      1e9
    );
  }

  _updateDeSoToBuy(newVal) {
    if (newVal == null || newVal === '') {
      this.buyDeSoFields.desoToBuy = '';
      this.buyDeSoFields.bitcoinToExchange = '';
    } else {
      // The .999 factor comes in due to having to consider BitcoinExchangeFeeBasisPoints
      // that goes to pay the miner.
      this.buyDeSoFields.bitcoinToExchange = (
        this._computeSatoshisToBurnGivenDeSoNanos(newVal * 1e9) / 1e8
      ).toFixed(8);
    }

    // Update the Bitcoin fee.
    this._updateBitcoinFee(parseFloat(this.buyDeSoFields.bitcoinToExchange));
  }

  _updateBitcoinToExchange(newVal) {
    if (newVal == null || newVal === '') {
      this.buyDeSoFields.bitcoinToExchange = '';
      this.buyDeSoFields.desoToBuy = '';
    } else {
      // Compute the amount of DeSo the user can buy for this amount of Bitcoin and
      // set it.
      //
      // The .999 factor comes in due to having to consider BitcoinExchangeFeeBasisPoints
      // that goes to pay the miner.
      this.buyDeSoFields.desoToBuy = (
        this._computeNanosToCreateGivenSatoshisToBurn(
          parseFloat(this.buyDeSoFields.bitcoinToExchange) * 1e8
        ) / 1e9
      ).toFixed(9);
    }

    // Update the Bitcoin fee.
    this._updateBitcoinFee(parseFloat(this.buyDeSoFields.bitcoinToExchange));
  }

  _queryBitcoinAPI() {
    // If we are already querying the bitcoin API, abort mission!
    if (this.queryingBitcoinAPI) {
      return;
    }

    this.appData.latestBitcoinAPIResponse = null;
    this.queryingBitcoinAPI = true;

    this.backendApi
      .GetBitcoinAPIInfo(this.btcDepositAddress(), this.appData.isTestnet)
      .subscribe(
        (resProm: any) => {
          resProm
            .then((res) => {
              this.appData.latestBitcoinAPIResponse = res;

              this.queryingBitcoinAPI = false;
            })
            .catch(() => {
              this.queryingBitcoinAPI = false;
            });
        },
        (error) => {
          this.queryingBitcoinAPI = false;
          console.error('Error getting BitcoinAPI data: ', error);
        }
      );
  }

  ngOnInit() {
    window.scroll(0, 0);

    // Add extra tabs
    this.route.params.subscribe((params) => {
      const ticker = (params.ticker || '').toUpperCase();
      if (ticker === 'BTC') {
        this.buyTabs = [BuyDeSoComponent.BUY_WITH_BTC];
        this.activeTab = BuyDeSoComponent.BUY_WITH_BTC
      } else if (ticker === 'ETH' && this.globalVars.showBuyWithETH) {
        this.buyTabs = [BuyDeSoComponent.BUY_WITH_ETH];
        this.activeTab = BuyDeSoComponent.BUY_WITH_ETH;
      } else if (this.globalVars.showBuyWithUSD) {
        this.buyTabs.push(BuyDeSoComponent.BUY_WITH_USD);
      }
    });

    // Query the website to get the fees.
    this.backendApi.GetBitcoinFeeRateSatoshisPerKB().subscribe(
      (res: any) => {
        if (res.priority != null) {
          this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB =
            2.0 * res.priority * 1000;
          // console.log('Using Bitcoin sats/KB fee: ', this.buyDeSoFields.bitcoinTransactionFeeRateSatoshisPerKB)
        } else {
          console.error(
            "res.priority was null so didn't set default fee: ",
            res
          );
        }
      },
      (error) => {
        console.error('Problem getting Bitcoin fee: ', error);
      }
    );

    this._queryBitcoinAPI();
    // Force an update of the exchange rate when loading the Buy DeSo page to ensure our computations are using the
    // latest rates.
    this.globalVars._updateDeSoExchangeRate();
  }

  _handleTabClick(tab: string): void {
    this.activeTab = tab;
  }
}
