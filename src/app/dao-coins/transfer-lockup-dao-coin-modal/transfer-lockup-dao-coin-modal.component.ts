import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  BalanceEntryResponse,
  DAOCoinOperationTypeString, ProfileEntryResponse, TransferRestrictionStatusString
} from '../../backend-api.service';
import { toBN } from 'web3-utils';

@Component({
  selector: 'transfer-lockup-dao-coin-modal',
  templateUrl: './transfer-lockup-dao-coin-modal.component.html',
})
export class TransferLockupDaoCoinModalComponent {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  receiverIsDAOMember: boolean = false;
  coinsToLockup: number = 0;
  unlockTimestampNanoSecs: number = 0;
  vestingEndTimestampNanoSecs: number = 0;
  lockingDAOCoin: boolean = false;
  validationErrors: string[] = [];
  backendErrors: string = '';
  recipientPublicKey: string = '';
  lockupRecipient: ProfileEntryResponse;
  lockedBalanceEntry: any;
  lockedBalanceEntries = [
    TransferRestrictionStatusString.UNRESTRICTED,
    TransferRestrictionStatusString.PROFILE_OWNER_ONLY,
    TransferRestrictionStatusString.DAO_MEMBERS_ONLY,
    TransferRestrictionStatusString.PERMANENTLY_UNRESTRICTED,
  ];
  amountToTransfer: number = 0;
  transferringDAOCoin: boolean;
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}


  updateValidationErrors(): void {
    let err: string[] = [];
    return;
    // (1) Check if the logged-in user is trying to transfer to themselves.
    if (
      this.lockupRecipient?.PublicKeyBase58Check ===
      this.globalVars.loggedInUser?.PublicKeyBase58Check
    ) {
      err.push('Cannot transfer locked tokens to yourself\n');
    }

   // (2) Ensure the transfer amount is non-zero.
    if (this.coinsToLockup <= 0) {
      err.push('Must transfer a non-zero amount\n');
    }

    // (3) Ensure the transfer has sufficient balance.
    // TODO: This needs to verify against the locked balance entry not the balance entry...
    if (
      this.globalVars
        .unitToBNNanos(this.coinsToLockup || 0)
        .gt(toBN(this.balanceEntryResponse.BalanceNanosUint256))
    ) {
      err.push('Amount to lockup exceeds balance\n');
    }

    // (4) Validate lockup transfer restrictions surrounding the locked tokens.
    // (4a) Check if the lockup transfers are profile owner only.
    if (
      this.lockupRecipient &&
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry
        .LockupTransferRestrictionStatus ===
      TransferRestrictionStatusString.PROFILE_OWNER_ONLY &&
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check !==
      this.globalVars.loggedInUser?.PublicKeyBase58Check &&
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check !==
      this.lockupRecipient?.PublicKeyBase58Check
    ) {
      err.push(
        'This DAO coin can only be transferred to or from the profile owner\n'
      );
    }

    // Update the validationErrors displayed.
    this.validationErrors = err;
  }

  _handleCreatorSelectedInSearch(creator) {
    // We set the components receiver variable to the passed creator.
    this.lockupRecipient = creator;

    // We check if the Lockup Transfer Restriction Status requires a DAO Member Lookup.
    if (
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.LockupTransferRestrictionStatus ===
      TransferRestrictionStatusString.DAO_MEMBERS_ONLY
    ) {
      // Search using backendApi for whether the receiver is holding creator.
      this.backendApi
        .IsHodlingPublicKey(
          this.globalVars.localNode,
          this.lockupRecipient.PublicKeyBase58Check,
          this.balanceEntryResponse.CreatorPublicKeyBase58Check,
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

  getLockedBalanceEntryDropdownText(option: any) {
    return option;
  }
}
