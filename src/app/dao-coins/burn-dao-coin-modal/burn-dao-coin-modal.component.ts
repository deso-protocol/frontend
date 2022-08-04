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
  selector: 'burn-dao-coin-modal',
  templateUrl: './burn-dao-coin-modal.component.html',
})
export class BurnDaoCoinModalComponent {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  amountToBurn: number = 0;
  burningDAOCoin: boolean = false;
  validationErrors: string[] = [];
  backendErrors: string = '';
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  burnDAOCoin(): void {
    this.burningDAOCoin = true;
    this.backendErrors = '';
    this.backendApi
      .DAOCoin(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.balanceEntryResponse.CreatorPublicKeyBase58Check,
        DAOCoinOperationTypeString.BURN,
        undefined,
        undefined,
        this.globalVars.toHexNanos(this.amountToBurn),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason(
            `dao coins burned|${this.globalVars.toHexNanos(this.amountToBurn)}`
          );
          this.bsModalRef.hide();
        },
        (err) => {
          this.backendErrors = err.error.error;
          console.error(err);
        }
      )
      .add(() => (this.burningDAOCoin = false));
  }

  updateValidationErrors(): void {
    let err: string[] = [];
    if (this.amountToBurn <= 0) {
      err.push('Must transfer a non-zero amount\n');
    }
    if (
      this.globalVars
        .unitToBNNanos(this.amountToBurn || 0)
        .gt(toBN(this.balanceEntryResponse.BalanceNanosUint256))
    ) {
      err.push('Amount to burn exceeds balance\n');
    }
    this.validationErrors = err;
  }
}
