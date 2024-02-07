import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  BalanceEntryResponse, CumulativeLockedBalanceEntryResponse,
  DAOCoinOperationTypeString
} from '../../backend-api.service';
import { toBN } from 'web3-utils';

@Component({
  selector: 'unlock-dao-coin-modal',
  templateUrl: './unlock-dao-coin-modal.component.html',
})
export class UnlockDaoCoinModalComponent {
  @Input() cumulativeLockedBalanceEntryResponse: CumulativeLockedBalanceEntryResponse;

  // Schedule / Timestamp Toggle Booleans
  showUnlockSchedule: boolean = false;
  useUnixTimestamps: boolean = false;

  // Component State Variables
  unlockingDAOCoin: boolean = false;
  validationErrors: string[] = [];
  backendErrors: string = '';
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  unlockDAOCoin(): void {
    // First we do a validation check on whether coins can even be unlocked.
    let err: string[] = [];
    if (toBN(this.cumulativeLockedBalanceEntryResponse.UnlockableBaseUnits).eqn(0)) {
      err.push('There is nothing to unlock\n');
      this.validationErrors = err;
      return;
    }

    // If we reach here, we hit the backend API with the request.
    this.unlockingDAOCoin = true;
    this.backendErrors = '';
    this.backendApi.
      CoinUnlock(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.cumulativeLockedBalanceEntryResponse.ProfilePublicKeyBase58Check,
        {},
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason(
            `coins unlocked|${this.cumulativeLockedBalanceEntryResponse.UnlockableBaseUnits}`
          );
          this.bsModalRef.hide();
        },
        (err) => {
          this.backendErrors = err.error.error;
          console.error(err)
        }
      )
      .add(() => (this.unlockingDAOCoin = false))
  }

  formatTimestamp(timestamp: number): string {
    if (this.useUnixTimestamps) {
      return timestamp.toString();
    } else {
      // Convert the timestamp to a date object.
      const date = new Date(timestamp / 1e6)

      // Set the Options for how to show each portion of the timestamp.
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      return new Intl.DateTimeFormat('default', options).format(date)
    }
  }
}
