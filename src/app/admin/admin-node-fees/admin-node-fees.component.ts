import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalVarsService } from '../../global-vars.service';
import {
  BackendApiService,
  ProfileEntryResponse,
  TransactionFee,
} from '../../backend-api.service';
import { SwalHelper } from '../../../lib/helpers/swal-helper';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AdminNodeAddFeesComponent } from './admin-node-add-fee/admin-node-add-fees.component';

@Component({
  selector: 'admin-node-fees',
  templateUrl: './admin-node-fees.component.html',
  styleUrls: ['./admin-node-fees.component.scss'],
})
export class AdminNodeFeesComponent implements OnInit {
  static FEES = 'Fees';
  static EXEMPT_KEYS = 'Exempt Keys';
  tabs = [AdminNodeFeesComponent.FEES, AdminNodeFeesComponent.EXEMPT_KEYS];
  loading = true;
  removingFee = false;
  transactionFeeMap: { [k: string]: TransactionFee[] };
  exemptPublicKeyMap: { [k: string]: ProfileEntryResponse | null };
  activeTab: string = AdminNodeFeesComponent.FEES;
  selectedCreator: any;
  addingExemptKey = false;

  AdminNodeFeesComponent = AdminNodeFeesComponent;

  constructor(
    public globalVars: GlobalVarsService,
    private modalService: BsModalService,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {}

  ngOnInit() {
    this.backendApi
      .AdminGetTransactionFeeMap(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res) => {
          this.transactionFeeMap = res.TransactionFeeMap;
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => (this.loading = false));

    this.backendApi
      .AdminGetExemptPublicKeys(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check
      )
      .subscribe(
        (res) => {
          this.exemptPublicKeyMap = res.ExemptPublicKeyMap;
        },
        (err) => {
          console.error(err);
        }
      );
  }

  addNewFee(txnType: string) {
    const addFeeModal = this.modalService.show(AdminNodeAddFeesComponent, {
      class: 'modal-dialog-centered modal-lg',
      initialState: { txnType, transactionFeeMap: this.transactionFeeMap },
    });
    addFeeModal.content.feeAdded.subscribe(
      (transactionFeeMap) => (this.transactionFeeMap = transactionFeeMap)
    );
  }

  removeFee(txnType: string, publicKeyBase58Check: string): void {
    let transactionFeesForType = this.transactionFeeMap[txnType];
    const txnFeeIndex = transactionFeesForType.findIndex(
      (txn) => txn.PublicKeyBase58Check === publicKeyBase58Check
    );
    if (txnFeeIndex < 0) {
      return;
    }
    if (this.removingFee) {
      return;
    }
    const txnFee = transactionFeesForType[txnFeeIndex];
    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      html: `Remove fee of ${this.globalVars.nanosToDeSo(
        txnFee.AmountNanos
      )} DESO for ${
        txnFee.ProfileEntryResponse?.Username || txnFee.PublicKeyBase58Check
      }
        for all ${txnType} transactions.`,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: 'btn btn-light',
        cancelButton: 'btn btn-light no',
      },
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then(async (alertRes: any) => {
      if (alertRes.isConfirmed) {
        transactionFeesForType.splice(txnFeeIndex, 1);
        this.removingFee = true;
        console.log(transactionFeesForType);
        this.backendApi
          .AdminSetTxnFeeForTxnType(
            this.globalVars.localNode,
            this.globalVars.loggedInUser?.PublicKeyBase58Check,
            txnType,
            transactionFeesForType
          )
          .subscribe(
            (res) => {
              this.transactionFeeMap = res.TransactionFeeMap;
            },
            (err) => {
              console.error(err);
            }
          )
          .add(() => (this.removingFee = false));
      }
    });
  }

  _handleTabClick(tab: string): void {
    this.activeTab = tab;
  }

  addExemptKey(): void {
    this.addingExemptKey = true;
    this.backendApi
      .AdminAddExemptPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.selectedCreator?.PublicKeyBase58Check,
        false
      )
      .subscribe(
        (res) => {
          this.exemptPublicKeyMap[
            this.selectedCreator?.PublicKeyBase58Check
          ] = this.selectedCreator;
          this.selectedCreator = null;
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => (this.addingExemptKey = false));
  }

  removeExemptKey(publicKeyBase58Check: string): void {
    if (this.addingExemptKey) {
      return;
    }
    this.addingExemptKey = true;
    this.backendApi
      .AdminAddExemptPublicKey(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        publicKeyBase58Check,
        true
      )
      .subscribe(
        (res) => {
          delete this.exemptPublicKeyMap[publicKeyBase58Check];
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => (this.addingExemptKey = false));
  }
}
