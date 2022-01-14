import { Component, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../../global-vars.service";
import {
  BackendApiService,
  BalanceEntryResponse,
  ProfileEntryResponse,
  TransferRestrictionStatusString,
} from "../../backend-api.service";
import { toBN } from "web3-utils";

@Component({
  selector: "transfer-dao-coin-modal",
  templateUrl: "./transfer-dao-coin-modal.component.html",
})
export class TransferDAOCoinModalComponent {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  amountToTransfer: number = 0;
  receiver: ProfileEntryResponse;
  receiverIsDAOMember: boolean = false;
  transferringDAOCoin: boolean = false;
  backendErrors: string = "";
  validationErrors: string[] = [];
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  _handleCreatorSelectedInSearch(creator): void {
    this.receiver = creator;
    if (
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.TransferRestrictionStatus ===
      TransferRestrictionStatusString.DAO_MEMBERS_ONLY
    ) {
      this.backendApi
        .IsHodlingPublicKey(
          this.globalVars.localNode,
          this.receiver.PublicKeyBase58Check,
          this.balanceEntryResponse.CreatorPublicKeyBase58Check,
          true
        )
        .subscribe((res) => {
          this.receiverIsDAOMember = res.IsHodling;
        })
        .add(() => this.updateValidationErrors());
    }
    this.updateValidationErrors();
  }

  transferDAOCoin(): void {
    this.transferringDAOCoin = true;
    this.backendErrors = "";
    this.backendApi
      .TransferDAOCoin(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        this.balanceEntryResponse.CreatorPublicKeyBase58Check,
        this.receiver.PublicKeyBase58Check,
        this.globalVars.toHexNanos(this.amountToTransfer),
        this.globalVars.defaultFeeRateNanosPerKB
      )
      .subscribe(
        (res) => {
          this.modalService.setDismissReason("dao coins transferred");
          this.bsModalRef.hide();
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
    if (this.receiver?.PublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check) {
      err.push("Cannot transfer to yourself\n");
    }
    if (this.receiver && this.amountToTransfer <= 0) {
      err.push("Must transfer a non-zero amount\n");
    }
    if (
      this.globalVars.unitToBNNanos(this.amountToTransfer || 0).gt(toBN(this.balanceEntryResponse.BalanceNanosUint256))
    ) {
      err.push("Amount to transfer exceeds balance\n");
    }
    if (
      this.receiver &&
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.TransferRestrictionStatus ===
        TransferRestrictionStatusString.PROFILE_OWNER_ONLY &&
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check !==
        this.globalVars.loggedInUser?.PublicKeyBase58Check &&
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check !== this.receiver?.PublicKeyBase58Check
    ) {
      err.push("This DAO coin can only be transferred to or from the profile owner\n");
    }
    if (
      this.receiver &&
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.TransferRestrictionStatus ===
        TransferRestrictionStatusString.DAO_MEMBERS_ONLY &&
      !this.receiverIsDAOMember &&
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check !==
        this.globalVars.loggedInUser?.PublicKeyBase58Check
    ) {
      err.push("This DAO coin can only be transferred to existing DAO members\n");
    }
    this.validationErrors = err;
  }
}
