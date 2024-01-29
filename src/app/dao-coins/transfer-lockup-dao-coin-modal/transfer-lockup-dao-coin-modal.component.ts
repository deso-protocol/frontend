import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  CumulativeLockedBalanceEntryResponse,
  LockedBalanceEntryResponse,
  ProfileEntryResponse,
  TransferRestrictionStatusString
} from '../../backend-api.service';
import { toBN } from 'web3-utils';

@Component({
  selector: 'transfer-lockup-dao-coin-modal',
  templateUrl: './transfer-lockup-dao-coin-modal.component.html',
})
export class TransferLockupDaoCoinModalComponent {
  @Input() cumulativeLockedBalanceEntryResponse: CumulativeLockedBalanceEntryResponse;

  receiverIsDAOMember: boolean = false;
  validationErrors: string[] = [];
  backendErrors: string = '';
  lockupRecipient: ProfileEntryResponse;
  coinsToTransfer: number = 0;
  transferringDAOCoin: boolean;
  useUnixTimestamps: boolean = false;
  selectedLockedBalanceEntry: LockedBalanceEntryResponse;
  selectedLockedBalanceEntryUnlockTimestamp: string;
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  transferLockedDAOCoin(): void {
    this.transferringDAOCoin = true;
    this.backendErrors = '';

    // Hit the backend API with the request.
    this.backendApi.CoinLockupTransfer(
      this.globalVars.localNode,
      this.globalVars.loggedInUser?.PublicKeyBase58Check,
      this.cumulativeLockedBalanceEntryResponse.ProfilePublicKeyBase58Check,
      this.lockupRecipient.PublicKeyBase58Check,
      this.selectedLockedBalanceEntry.UnlockTimestampNanoSecs,
      this.globalVars.toHexNanos(this.coinsToTransfer),
      {},
      this.globalVars.defaultFeeRateNanosPerKB
    )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason(
            `coins transferred|${this.globalVars.toHexNanos(this.coinsToTransfer)}`
          );
          this.bsModalRef.hide()
        },
        (err) => {
          this.backendErrors = err.error.error;
          console.error(err);
        }
      )
      .add(() => (this.transferringDAOCoin = false));
  }


  updateValidationErrors(): void {
    let err: string[] = [];

    // (1) Check that the amount to transfer is less than the amount in the selected balance.
    if (this.selectedLockedBalanceEntry) {
      if (
        this.globalVars
          .unitToBNNanos(this.coinsToTransfer || 0)
          .gt(toBN(this.selectedLockedBalanceEntry.BalanceBaseUnits))
      ) {
        err.push('Amount to transfer exceeds balance\n');
      }
    }

    // (2) Check that the amount to transfer is non-zero.
    if (this.coinsToTransfer === 0) {
      err.push('Must transfer a non-zero amount')
    }

    // (3) Check that a recipient is specified.
    if (!this.lockupRecipient) {
      err.push('Must select a recipient\n');
    }

    // (4) Verify transfer rules are being respected.
    if (this.lockupRecipient) {
      // (4a) Check for profile owner only restrictions.
      if (
        this.cumulativeLockedBalanceEntryResponse.ProfileEntryResponse?.DAOCoinEntry?.LockupTransferRestrictionStatus
        === TransferRestrictionStatusString.PROFILE_OWNER_ONLY &&
        (this.cumulativeLockedBalanceEntryResponse?.ProfilePublicKeyBase58Check !==
        this.globalVars.loggedInUser?.PublicKeyBase58Check)
      ) {
        err.push('Transfers are restricted to profile owner only\n')
      }

      // (4b) Check if transfers are restricted to/from DAO members only.
      if (
        this.cumulativeLockedBalanceEntryResponse.ProfileEntryResponse?.DAOCoinEntry?.LockupTransferRestrictionStatus
        === TransferRestrictionStatusString.DAO_MEMBERS_ONLY  && !this.receiverIsDAOMember
      ) {
        err.push('Transfers are restricted to DAO members only\n')
      }
    }

    this.validationErrors = err;
  }

  _handleCreatorSelectedInSearch(creator) {
    // We set the components receiver variable to the passed creator.
    this.lockupRecipient = creator;

    // We check if the Lockup Transfer Restriction Status requires a DAO Member Lookup.
    if (
      this.cumulativeLockedBalanceEntryResponse.ProfileEntryResponse?.DAOCoinEntry?.LockupTransferRestrictionStatus ===
      TransferRestrictionStatusString.DAO_MEMBERS_ONLY
    ) {
      // Search using backendApi for whether the receiver is holding creator.
      this.backendApi
        .IsHodlingPublicKey(
          this.globalVars.localNode,
          this.lockupRecipient.PublicKeyBase58Check,
          this.cumulativeLockedBalanceEntryResponse.ProfilePublicKeyBase58Check,
          true
        )
        .subscribe((res) =>{
          // On response from the API, update the receiverIsDAOMember boolean and check validations.
          this.receiverIsDAOMember = res.IsHodling;
        })
        .add(() => this.updateValidationErrors())
    }

    // Before exiting, check validations in the event the receiver is invalid.
    this.updateValidationErrors();
  }

  getLockedBalanceEntryDropdownText(entry: LockedBalanceEntryResponse) {
    return this.formatTimestamp(entry.UnlockTimestampNanoSecs) +
      ' - ' +
      this.globalVars.hexNanosToUnitString(entry.BalanceBaseUnits) + ' coins';
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

  _handleLockedBalanceEntrySelected(lockedBalanceEntryUnlockTimestamp) {
    // Find the associated LockedBalanceEntry.
    this.selectedLockedBalanceEntry = this.cumulativeLockedBalanceEntryResponse.UnvestedLockedBalanceEntries.find(
      entry => entry.UnlockTimestampNanoSecs.toString() === lockedBalanceEntryUnlockTimestamp
    )

    // Check validation errors with the newly selected locked balance entry.
    this.updateValidationErrors()
  }
}
