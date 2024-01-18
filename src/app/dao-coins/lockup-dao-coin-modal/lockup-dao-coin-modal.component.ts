import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  BalanceEntryResponse,
  DAOCoinOperationTypeString,
} from '../../backend-api.service';
import { toBN } from 'web3-utils';

@Component({
  selector: 'lockup-dao-coin-modal',
  templateUrl: './lockup-dao-coin-modal.component.html',
})
export class LockupDaoCoinModalComponent {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  coinsToLockup: number = 0;
  unlockTimestampNanoSecs: number = 0;
  vestingEndTimestampNanoSecs: number = 0;
  lockingDAOCoin: boolean = false;
  validationErrors: string[] = [];
  backendErrors: string = '';
  recipientPublicKey: string = '';
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  burnDAOCoin(): void {
    this.lockingDAOCoin = true;
    this.backendErrors = '';
    this.backendApi
      .DAOCoin(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.balanceEntryResponse.CreatorPublicKeyBase58Check,
        DAOCoinOperationTypeString.BURN,
        undefined,
        undefined,
        this.globalVars.toHexNanos(this.coinsToLockup),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason(
            `dao coins burned|${this.globalVars.toHexNanos(this.coinsToLockup)}`
          );
          this.bsModalRef.hide();
        },
        (err) => {
          this.backendErrors = err.error.error;
          console.error(err);
        }
      )
      .add(() => (this.lockingDAOCoin = false));
  }

  updateValidationErrors(): void {
    let err: string[] = [];
    if (this.coinsToLockup <= 0) {
      err.push('Must transfer a non-zero amount\n');
    }
    if (
      this.globalVars
        .unitToBNNanos(this.coinsToLockup || 0)
        .gt(toBN(this.balanceEntryResponse.BalanceNanosUint256))
    ) {
      err.push('Amount to burn exceeds balance\n');
    }
    this.validationErrors = err;
  }
}
