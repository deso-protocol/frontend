import { Component, Input, NgModule, OnDestroy, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  BalanceEntryResponse,
  DAOCoinOperationTypeString, ProfileEntryResponse
} from '../../backend-api.service';
import { toBN } from 'web3-utils';
import { OverlayContainer } from '@angular/cdk/overlay';
import { update } from 'lodash';

@Component({
  selector: 'lockup-dao-coin-modal',
  templateUrl: './lockup-dao-coin-modal.component.html',
})
export class LockupDaoCoinModalComponent implements OnInit, OnDestroy {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  lockupRecipient: ProfileEntryResponse;
  vestedLockup: boolean = false;
  unlockDate: Date;
  unlockTime: string;
  unlockUnixNanoTimestamp: number = 0;
  vestingEndDate: Date;
  vestingEndTime: string;
  vestingEndUnixNanoTimestamp: number = 0;
  profileIsUser: boolean;
  coinsToLockup: number = 0;
  lockingDAOCoin: boolean = false;
  validationErrors: string[] = [];
  validationWarnings: string[] = [];
  backendErrors: string = '';
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    public overlayContainer: OverlayContainer,
    private backendApi: BackendApiService
  ) {}

  ngOnInit() {
    // We add the lockup-dao-coin-modal class to an overlay container to ensure
    // the date/time pickers are displayed correctly (above instead of below the modal).
    // We use this code here to prevent relying on global modifications to mat-datepicker-toggle css.
    const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;
    overlayContainerClasses.add('lockup-dao-coin-modal')

    // We check if the logged-in user matched the profile to enable vesting on Init.
    this.profileIsUser =
      (this.balanceEntryResponse?.CreatorPublicKeyBase58Check ===
        this.globalVars.loggedInUser.PublicKeyBase58Check)
  }

  ngOnDestroy() {
    // See the comment in ngOnInit to understand why we do this.
    const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;
    overlayContainerClasses.remove('lockup-dao-coin-modal')
  }

  lockupDAOCoin(): void {
    this.lockingDAOCoin = true;
    this.backendErrors = '';

    // We need to check if we're vesting or not vesting.
    if (!this.vestedLockup) {
      this.vestingEndUnixNanoTimestamp = this.unlockUnixNanoTimestamp
    }

    // Hit the backend API with the request.
    this.backendApi
      .CoinLockup(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.balanceEntryResponse.CreatorPublicKeyBase58Check,
        this.lockupRecipient.PublicKeyBase58Check,
        this.unlockUnixNanoTimestamp,
        this.vestingEndUnixNanoTimestamp,
        this.globalVars.toHexNanos(this.coinsToLockup),
        {},
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason(
            `coins locked|${this.globalVars.toHexNanos(this.coinsToLockup)}`
          );
          this.bsModalRef.hide()
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
    let warnings: string[] = [];

    // (1) Check to ensure the balance specified is reasonable
    if (this.coinsToLockup <= 0) {
      err.push('Must lockup a non-zero amount\n');
    }
    if (
      this.globalVars
        .unitToBNNanos(this.coinsToLockup || 0)
        .gt(toBN(this.balanceEntryResponse.BalanceNanosUint256))
    ) {
      err.push('Amount to burn exceeds balance\n');
    }

    // (2) Check to ensure the lockup unlock date/time is at least current.
    if (this.unlockTime && this.unlockDate) {
      const [hours, minutes] = this.unlockTime.split(':');
      const unlockDateTime = new Date(this.unlockDate);
      unlockDateTime.setHours(
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      );

      const now = new Date();
      if (unlockDateTime <  now) {
        err.push('Cannot have an unlock date in the past\n')
      } else {
        // We add a warning in the event the unlock date is within the next day.
        now.setDate(now.getDate() + 1)
        if (unlockDateTime < now) {
          warnings.push('Warning: unlocks in the near future may result in a rejected transaction')
        }
      }
    }

    // (3) Check that the vesting end is after the unlock time.
    if (this.unlockTime && this.unlockDate && this.vestingEndDate && this.vestingEndTime && this.vestedLockup) {
      // Combine the distinct times into a common format.
      const [unlockHours, unlockMinutes] = this.unlockTime.split(':');
      const unlockDateTime = new Date(this.unlockDate);
      unlockDateTime.setHours(
        parseInt(unlockHours, 10),
        parseInt(unlockMinutes, 10),
        0,
        0
      );
      const [vestingEndHours, vestingEndMinutes] = this.vestingEndTime.split(':');
      const vestingEndDateTime = new Date(this.vestingEndDate);
      vestingEndDateTime.setHours(
        parseInt(vestingEndHours, 10),
        parseInt(vestingEndMinutes, 10),
        0,
        0
      );

      if (vestingEndDateTime < unlockDateTime) {
        err.push('Cannot have a vesting schedule into the past\n');
      }
    }

    // (4) Ensure there's a recipient.
    if (!this.lockupRecipient) {
      err.push('Must select a recipient\n')
    }

    this.validationErrors = err;
    this.validationWarnings = warnings;
  }

  updateUnlockUnixNanoSeconds() {
    // If the date or time is not set, exit.
    if (!this.unlockTime || !this.unlockDate) {
      return
    }

    // Combine the specified date and time.
    const [unlockHours, unlockMinutes] = this.unlockTime.split(':');
    const unlockDateTime = new Date(this.unlockDate);
    unlockDateTime.setHours(
      parseInt(unlockHours, 10),
      parseInt(unlockMinutes, 10),
      0,
      0
    );

    // Convert the unlockDateTime to a UTC representation.
    this.unlockUnixNanoTimestamp = unlockDateTime.getTime() * 1e6;
  }

  updateUnlockDateTime() {
    // Convert the timestamp from nanos to milliseconds.
    const unlockUnixMsTimestamp = this.unlockUnixNanoTimestamp / 1e6;

    // Get the attributes from the timestamp.
    const date = new Date(unlockUnixMsTimestamp);

    // Update the date object.
    this.unlockDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Update the time object.
    const hoursString = ("0" + date.getHours()).slice(-2)
    const minutesString = ("0" + date.getMinutes()).slice(-2)
    this.unlockTime = `${hoursString}:${minutesString}`
  }

  updateVestingEndUnixNanoSeconds() {
    // If the date or time is not set, exit.
    if (!this.vestingEndDate || !this.vestingEndTime) {
      return
    }

    // Combine the specified date and time.
    const [unlockHours, unlockMinutes] = this.vestingEndTime.split(':');
    const vestingEndDateTime = new Date(this.vestingEndDate);
    vestingEndDateTime.setHours(
      parseInt(unlockHours, 10),
      parseInt(unlockMinutes, 10),
      0,
      0
    );

    // Convert the vestingEndDateTime to a UTC representation.
    this.vestingEndUnixNanoTimestamp = vestingEndDateTime.getTime() * 1e6;
  }

  updateVestingEndDateTime() {
    // Convert the timestamp from nanos to milliseconds.
    const vestingEndUnixMsTimestamp = this.vestingEndUnixNanoTimestamp / 1e6;

    // Get the attributes from the timestamp.
    const date = new Date(vestingEndUnixMsTimestamp);

    // Update the date object.
    this.vestingEndDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Update the time object.
    const hoursString = ("0" + date.getHours()).slice(-2)
    const minutesString = ("0" + date.getMinutes()).slice(-2)
    this.vestingEndTime = `${hoursString}:${minutesString}`
  }

  _handleCreatorSelectedInSearch(creator): void {
    // Set the recipient as the response.
    this.lockupRecipient =  creator

    // Update any validation errors.
    this.updateValidationErrors()
  }
}
