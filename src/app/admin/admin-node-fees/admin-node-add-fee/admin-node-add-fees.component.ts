import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../../../global-vars.service";
import { BackendApiService, ProfileEntryResponse, TransactionFee } from "../../../backend-api.service";
import { SwalHelper } from "../../../../lib/helpers/swal-helper";

@Component({
  selector: "admin-node-add-fees",
  templateUrl: "./admin-node-add-fees.component.html",
})
export class AdminNodeAddFeesComponent implements OnInit {
  @Input() txnType: string;
  @Input() transactionFeeMap: { [k: string]: TransactionFee[] };

  @Output() feeAdded = new EventEmitter();
  publicKey: string;
  feeAmount: number;
  selectedCreator: ProfileEntryResponse;
  updatingAllTxns: boolean = false;
  updatingTransactionFees: boolean = false;

  constructor(
    private backendApi: BackendApiService,
    public globalVars: GlobalVarsService,
    public bsModalRef: BsModalRef
  ) {}

  ngOnInit() {
    if (this.txnType === "ALL") {
      this.updatingAllTxns = true;
    }
  }

  setTransactionFees(): void {
    if (!this.feeAmount || !this.selectedCreator?.PublicKeyBase58Check || this.updatingTransactionFees) {
      return;
    }
    let newTransactionFees: TransactionFee[] = [];
    let swalText: string;
    // If we're only updating one transaction type, we use the existing list of transaction fees for this type.
    // If we're updating the fee for all transactions, we overwrite.
    if (!this.updatingAllTxns) {
      newTransactionFees = this.transactionFeeMap[this.txnType] || [];
      swalText = `Click "Confirm" to add a fee on each ${this.txnType} transaction that will send ${
        this.feeAmount
      } $DESO to ${this.selectedCreator?.Username || this.selectedCreator?.PublicKeyBase58Check}.`;
    } else {
      swalText = `WARNING: This will overwrite all existing transaction fees you have set.\n Click "Confirm" to add a fee on all transactions that will send ${
        this.feeAmount
      } $DESO to ${this.selectedCreator?.Username || this.selectedCreator?.PublicKeyBase58Check}.`;
    }

    newTransactionFees = newTransactionFees.concat({
      PublicKeyBase58Check: this.selectedCreator.PublicKeyBase58Check,
      AmountNanos: this.feeAmount * 1e9,
    });

    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      html: swalText,
      showCancelButton: true,
      showConfirmButton: true,
      focusConfirm: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.updatingTransactionFees = true;
        // Call AdminSetAllTransactionFees if we're updating all fees.
        // Call AdminSetTxnFeeForTxnType if we're only updating fees for one type.
        // We handle the response the same way for either.
        (this.updatingAllTxns
          ? this.backendApi.AdminSetAllTransactionFees(
              this.globalVars.localNode,
              this.globalVars.loggedInUser?.PublicKeyBase58Check,
              newTransactionFees
            )
          : this.backendApi.AdminSetTxnFeeForTxnType(
              this.globalVars.localNode,
              this.globalVars.loggedInUser?.PublicKeyBase58Check,
              this.txnType,
              newTransactionFees
            )
        )
          .subscribe(
            (res) => {
              this.feeAdded.emit(res.TransactionFeeMap);
              this.bsModalRef.hide();
            },
            (err) => {
              console.error(err);
            }
          )
          .add(() => (this.updatingAllTxns = false));
      }
    });
  }
}
