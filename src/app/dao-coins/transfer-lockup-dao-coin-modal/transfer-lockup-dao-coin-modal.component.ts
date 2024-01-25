import { Component, Input } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  BalanceEntryResponse, CumulativeLockedBalanceEntryResponse,
  DAOCoinOperationTypeString, ProfileEntryResponse, TransferRestrictionStatusString
} from '../../backend-api.service';
import { toBN } from 'web3-utils';

@Component({
  selector: 'transfer-lockup-dao-coin-modal',
  templateUrl: './transfer-lockup-dao-coin-modal.component.html',
})
export class TransferLockupDaoCoinModalComponent {
  @Input() cumulativeLockedBalanceEntryResponse: CumulativeLockedBalanceEntryResponse;

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

    this.validationErrors = err;
  }

  _handleCreatorSelectedInSearch(creator) {
    // We set the components receiver variable to the passed creator.
    this.lockupRecipient = creator;

    // We check if the Lockup Transfer Restriction Status requires a DAO Member Lookup.
    if (
      this.cumulativeLockedBalanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.LockupTransferRestrictionStatus ===
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

  getLockedBalanceEntryDropdownText(option: any) {
    return option;
  }
}
