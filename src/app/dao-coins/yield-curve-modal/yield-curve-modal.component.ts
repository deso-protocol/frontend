import { Component, Input, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  CumulativeLockedBalanceEntryResponse,
  LockedBalanceEntryResponse, LockupYieldCurvePointResponse,
  ProfileEntryResponse,
  TransferRestrictionStatusString
} from '../../backend-api.service';

@Component({
  selector: 'yield-curve-modal',
  templateUrl: './yield-curve-modal.component.html',
})
export class YieldCurveModalComponent implements OnInit {
  @Input() cumulativeLockedBalanceEntryResponse: CumulativeLockedBalanceEntryResponse;

  loadingYieldCurvePoints: boolean = true;
  yieldCurvePoints: LockupYieldCurvePointResponse[] = [];
  useNanosecondsDuration: boolean = false;
  useBasisPoints: boolean = false;
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  ngOnInit(): void {
    this.loadingYieldCurvePoints = true;

    // When the component is loaded we fetch the corresponding yield curve points.
    this.backendApi.GetLockupYieldCurvePoints(
      this.globalVars.localNode,
      this.cumulativeLockedBalanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check,
    )
      .subscribe(
        (res) => {
          // Take the response and store them in yieldCurvePoints.
          // In the event res is falsy, we set an empty array in its place.
          this.yieldCurvePoints = res || [];

          this.loadingYieldCurvePoints = false;
        },
        (err) => {
          console.error(err);
          this.loadingYieldCurvePoints = false;
        }
      );
  }

  getDisplayTransferRestrictionStatus(
    transferRestrictionStatus: TransferRestrictionStatusString
  ): string {
    // If we're not provided a value, we assume it's unrestricted.
    transferRestrictionStatus =
      transferRestrictionStatus || TransferRestrictionStatusString.UNRESTRICTED;
    return transferRestrictionStatus
      .split('_')
      .map((status) => status.charAt(0).toUpperCase() + status.slice(1))
      .join(' ')
      .replace('Dao', 'DAO');
  }

  formatLockupDuration(duration: number): string {
    if (this.useNanosecondsDuration) {
      return duration.toString(10) + " (ns)"
    } else {
      return (duration / (1e9 * 60 * 60 * 24)).toFixed(2) + " (days)"
    }
  }

  formatPointYield(pointYield: number): string {
    if (this.useBasisPoints) {
      return pointYield.toString(10) + "bps"
    } else {
      return (pointYield / 100).toString(10) + "%"
    }
  }
}
