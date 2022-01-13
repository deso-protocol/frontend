import {Component, Input} from "@angular/core";
import {BsModalRef, BsModalService} from "ngx-bootstrap/modal";
import {GlobalVarsService} from "../../global-vars.service";
import {
  BackendApiService,
  BalanceEntryResponse,
  ProfileEntryResponse,
  TransferRestrictionStatusString
} from "../../backend-api.service";

@Component({
  selector: "transfer-dao-coin-modal",
  templateUrl: "./transfer-dao-coin-modal.component.html",
})
export class TransferDAOCoinModalComponent {
  @Input() balanceEntryResponse: BalanceEntryResponse;

  amountToTransfer: number = 0;
  receiver: ProfileEntryResponse;
  transferringDAOCoin: boolean = false;
  backendErrors: string = "";
  constructor(
    public bsModalRef: BsModalRef,
    public modalService: BsModalService,
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService
  ) {}

  _handleCreatorSelectedInSearch(creator): void {
    this.receiver = creator;
    // TODO: hit IsHodling if this DAO coin can only be transferred to DAO members to find out if this is a valid tranfser
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

  // TODO: add endpoint to check if transfer is valid.
  // TODO: some basic frontend validation
  errors(): string {
    let err = "";
    if (this.receiver.PublicKeyBase58Check === this.globalVars.loggedInUser?.PublicKeyBase58Check) {
      err += "Cannot transfer to yourself\n";
    }
    if (this.amountToTransfer <= 0) {
      err += "Must transfer a non-zero amount\n";
    }
    if (this.globalVars.unitToBNNanos(this.amountToTransfer).gt(this.balanceEntryResponse.BalanceNanosUint256)) {
      err += "Amount to transfer exceeds balance\n";
    }
    if (
      this.balanceEntryResponse.ProfileEntryResponse.DAOCoinEntry.TransferRestrictionStatus ===
        TransferRestrictionStatusString.PROFILE_OWNER_ONLY ||
      this.balanceEntryResponse.ProfileEntryResponse.PublicKeyBase58Check ===
        this.globalVars.loggedInUser?.PublicKeyBase58Check
    ) {
      err += "This DAO coin can only be transferred to or from the profile owner";
    }
    return err;
  }
}
