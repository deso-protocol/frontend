import { Component, OnInit } from '@angular/core';
import {
  BackendApiService,
  ProfileEntryResponse,
} from '../backend-api.service';
import { GlobalVarsService } from '../global-vars.service';
import { sprintf } from 'sprintf-js';
import { SwalHelper } from '../../lib/helpers/swal-helper';
import { Title } from '@angular/platform-browser';
import { RouteNames } from '../app-routing.module';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

class Messages {
  static INCORRECT_PASSWORD = `The password you entered was incorrect.`;
  static CONNECTION_PROBLEM = `There is currently a connection problem. Is your connection to your node healthy?`;
  static UNKOWN_PROBLEM = `There was a weird problem with the transaction. Debug output: %s`;
  static INSUFFICIENT_BALANCE = `You don't have enough DeSo to process the transaction. Try reducing the fee rate.`;
  static SEND_DESO_MIN = `You must send a non-zero amount of DeSo`;
  static INVALID_PUBLIC_KEY = `The public key you entered is invalid`;
  static CONFIRM_TRANSFER_TO_PUBKEY =
    'Send %s $DESO with a fee of %s DeSo for a total of %s DeSo to public key %s. %s';
  static CONFIRM_TRANSFER_TO_USERNAME =
    'Send %s $DESO with a fee of %s DeSo for a total of %s DeSo to username %s. %s';
  static MUST_PURCHASE_CREATOR_COIN = `You must purchase a creator coin before you can send $DESO`;
}

@Component({
  selector: 'transfer-deso',
  templateUrl: './transfer-deso.component.html',
  styleUrls: ['./transfer-deso.component.scss'],
})
export class TransferDeSoComponent implements OnInit {
  globalVars: GlobalVarsService;
  transferDeSoError = '';
  startingSearchText = '';
  payToPublicKey = '';
  payToCreator: ProfileEntryResponse;
  transferAmount = 0;
  networkFee = 0;
  feeRateDeSoPerKB: string;
  callingUpdateSendDeSoTxnFee = false;
  loadingMax = false;
  maxSendAmount = 0;
  sendingDeSo = false;

  sendDeSoQRCode: string;

  constructor(
    private backendApi: BackendApiService,
    private globalVarsService: GlobalVarsService,
    private titleService: Title,
    private route: ActivatedRoute
  ) {
    this.globalVars = globalVarsService;
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.public_key) {
        this.startingSearchText = queryParams.public_key;
      }
    });
  }

  ngOnInit() {
    this.feeRateDeSoPerKB = (
      this.globalVars.defaultFeeRateNanosPerKB / 1e9
    ).toFixed(9);
    this.titleService.setTitle(`Send $DESO - ${environment.node.name}`);
    this.sendDeSoQRCode = `${this.backendApi._makeRequestURL(
      location.host,
      '/' + RouteNames.SEND_DESO
    )}?public_key=${this.globalVars.loggedInUser.PublicKeyBase58Check}`;
  }

  _clickMaxDeSo() {
    this.loadingMax = true;
    this.backendApi
      .SendDeSoPreview(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.payToPublicKey,
        // A negative amount causes the max value to be returned as the spend amount.
        -1,
        Math.floor(parseFloat(this.feeRateDeSoPerKB) * 1e9)
      )
      .subscribe(
        (res: any) => {
          this.loadingMax = false;
          if (
            res == null ||
            res.FeeNanos == null ||
            res.SpendAmountNanos == null
          ) {
            this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
            return null;
          }

          this.transferDeSoError = '';
          this.networkFee = res.FeeNanos / 1e9;
          this.transferAmount = res.SpendAmountNanos / 1e9;
          this.maxSendAmount = res.SpendAmountNanos / 1e9;
        },
        (error) => {
          this.loadingMax = false;
          console.error(error);
          this.transferDeSoError = this._extractError(error);
        }
      );
  }

  _clickSendDeSo() {
    if (this.globalVars.loggedInUser == null) {
      this.globalVars._alertError(
        'User must be logged in in order to send DeSo'
      );
      return;
    }

    if (this.payToPublicKey == null || this.payToPublicKey === '') {
      this.globalVars._alertError(
        'A valid pay-to public key or username must be set before you can send $DESO'
      );
      return;
    }

    if (this.transferDeSoError != null && this.transferDeSoError !== '') {
      this.globalVars._alertError(this.transferDeSoError);
      return;
    }

    if (this.transferAmount === 0 && this.networkFee === 0) {
      this.globalVars._alertError(Messages.SEND_DESO_MIN);
      return;
    }

    // Quick and dirty hack so that we can show the right alert if someone enters a username.
    let isUsername = false;
    if (
      this.payToPublicKey.substring(0, 2) != 'BC' &&
      this.payToPublicKey.length < 50
    ) {
      isUsername = true;
    }

    // Recompute the fee one more time and offer a confirmation.
    let desoTxnFeePromise = this._updateSendDeSoTxnFee(true /*force*/);

    if (desoTxnFeePromise == null) {
      this.globalVars._alertError(
        'There was a problem processing this transaction.'
      );
      return;
    }

    this.sendingDeSo = true;
    desoTxnFeePromise.then(
      (res) => {
        // If res is null then an error should be set.
        if (
          res == null ||
          res.FeeNanos == null ||
          res.SpendAmountNanos == null
        ) {
          this.sendingDeSo = false;
          this.globalVars._alertError(
            this.transferDeSoError,
            this.transferDeSoError === Messages.MUST_PURCHASE_CREATOR_COIN
          );
          return;
        }

        SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          title: 'Are you ready?',
          html: sprintf(
            isUsername
              ? Messages.CONFIRM_TRANSFER_TO_USERNAME
              : Messages.CONFIRM_TRANSFER_TO_PUBKEY,
            this.globalVars.nanosToDeSo(res.SpendAmountNanos),
            this.globalVars.nanosToDeSo(res.FeeNanos),
            this.globalVars.nanosToDeSo(res.SpendAmountNanos + res.FeeNanos),
            this.payToPublicKey,
            res.SpendAmountNanos / 1e9 === this.maxSendAmount
              ? 'Note: this is a max send. All your DESO is being transferred.'
              : ''
          ),
          showCancelButton: true,
          showConfirmButton: true,
          customClass: {
            confirmButton: 'btn btn-light',
            cancelButton: 'btn btn-light no',
          },
          reverseButtons: true,
        }).then((res: any) => {
          if (res.isConfirmed) {
            this.backendApi
              .SendDeSo(
                this.globalVars.localNode,
                this.globalVars.loggedInUser.PublicKeyBase58Check,
                this.payToPublicKey,
                this.transferAmount === this.maxSendAmount
                  ? -1
                  : this.transferAmount * 1e9,
                Math.floor(parseFloat(this.feeRateDeSoPerKB) * 1e9)
              )
              .subscribe(
                (res: any) => {
                  const {
                    TotalInputNanos,
                    SpendAmountNanos,
                    ChangeAmountNanos,
                    FeeNanos,
                    TransactionIDBase58Check,
                  } = res;

                  if (
                    res == null ||
                    FeeNanos == null ||
                    SpendAmountNanos == null ||
                    TransactionIDBase58Check == null
                  ) {
                    this.globalVars.logEvent('bitpop : send : error');
                    this.globalVars._alertError(Messages.CONNECTION_PROBLEM);
                    return null;
                  }

                  this.globalVars.logEvent('bitpop : send', {
                    TotalInputNanos,
                    SpendAmountNanos,
                    ChangeAmountNanos,
                    FeeNanos,
                  });

                  this.transferDeSoError = '';
                  this.networkFee = res.FeeNanos / 1e9;
                  this.transferAmount = 0.0;
                  this.maxSendAmount = 0.0;

                  // This will update the user's balance.
                  this.globalVars.updateEverything(
                    res.TxnHashHex,
                    this._sendDeSoSuccess,
                    this._sendDeSoFailure,
                    this
                  );
                },
                (error) => {
                  this.sendingDeSo = false;
                  console.error(error);
                  this.transferDeSoError = this._extractError(error);
                  this.globalVars.logEvent('bitpop : send : error', {
                    parsedError: this.transferDeSoError,
                  });
                  this.globalVars._alertError(
                    this.transferDeSoError,
                    this.transferDeSoError ===
                      Messages.MUST_PURCHASE_CREATOR_COIN
                  );
                }
              );

            return;
          } else {
            // This is the case where the user clicks "cancel."
            this.sendingDeSo = false;
          }

          return;
        });
        return;
      },
      (err) => {
        // If an error is returned then the error message should be set.
        this.globalVars._alertError(this.transferDeSoError);
        return;
      }
    );
  }

  _sendDeSoSuccess(comp: any) {
    // the button should no longer say "Working..."
    comp.globalVars._alertSuccess(
      sprintf('Successfully completed transaction.')
    );
    comp.sendingDeSo = false;
  }
  _sendDeSoFailure(comp: any) {
    comp.appData._alertError(
      'Transaction broadcast successfully but read node timeout exceeded. Please refresh.'
    );
    comp.sendingDeSo = false;
  }

  _updateSendDeSoTxnFee(force: boolean): Promise<any> {
    if (!this.globalVars.loggedInUser) {
      return;
    }

    if (this.callingUpdateSendDeSoTxnFee && !force) {
      console.log(
        'Not calling _updateSendDeSoTxnFee because callingUpdateSendDeSoTxnFee is false'
      );
      return;
    }

    if (this.payToPublicKey == null || this.payToPublicKey === '') {
      return;
    }

    this.callingUpdateSendDeSoTxnFee = true;
    return this.backendApi
      .SendDeSoPreview(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.payToPublicKey,
        this.transferAmount === this.maxSendAmount
          ? -1
          : Math.floor(this.transferAmount * 1e9),
        Math.floor(parseFloat(this.feeRateDeSoPerKB) * 1e9)
      )
      .toPromise()
      .then(
        (res: any) => {
          this.callingUpdateSendDeSoTxnFee = false;

          if (res == null || res.FeeNanos == null) {
            this.transferDeSoError = Messages.CONNECTION_PROBLEM;

            return null;
          }

          this.transferDeSoError = '';
          this.networkFee = res.FeeNanos / 1e9;
          return res;
        },
        (error) => {
          this.callingUpdateSendDeSoTxnFee = false;

          console.error(error);
          this.transferDeSoError = this._extractError(error);
          return null;
        }
      );
  }

  _extractError(err: any): string {
    if (err.error != null && err.error.error != null) {
      // Is it obvious yet that I'm not a frontend gal?
      // TODO: Error handling between BE and FE needs a major redesign.
      let rawError = err.error.error;
      if (rawError.includes('password')) {
        return Messages.INCORRECT_PASSWORD;
      } else if (rawError.includes('not sufficient')) {
        return Messages.INSUFFICIENT_BALANCE;
      } else if (rawError.includes('RuleErrorTxnMustHaveAtLeastOneInput')) {
        return Messages.SEND_DESO_MIN;
      } else if (
        (rawError.includes('SendDeSo: Problem') &&
          rawError.includes('Invalid input format')) ||
        rawError.includes('Checksum does not match')
      ) {
        return Messages.INVALID_PUBLIC_KEY;
      } else if (rawError.includes('You must purchase a creator coin')) {
        return Messages.MUST_PURCHASE_CREATOR_COIN;
      } else {
        return rawError;
      }
    }
    if (err.status != null && err.status != 200) {
      return Messages.CONNECTION_PROBLEM;
    }
    // If we get here we have no idea what went wrong so just alert the
    // errorString.
    return JSON.stringify(err);
  }

  _handleCreatorSelectedInSearch(creator: ProfileEntryResponse) {
    this.payToCreator = creator;
    this.payToPublicKey =
      creator?.Username || creator?.PublicKeyBase58Check || '';
  }
}
