import { Component, Input } from "@angular/core";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { GlobalVarsService } from "../../global-vars.service";
import { Router } from "@angular/router";
import { BackendApiService, BalanceEntryResponse, ProfileEntryResponse } from "../../backend-api.service";
import { Hex, toHex, toWei } from "web3-utils";

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
    private backendApi: BackendApiService,
    private router: Router
  ) {}

  _handleCreatorSelectedInSearch(creator): void {
    this.receiver = creator;
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
        this.toHexNanos(this.amountToTransfer),
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

  toHexNanos(units: number): Hex {
    return toHex(toWei(units.toString(), "gwei"));
  }

  // TODO: add endpoint to check if transfer is valid.
  // TODO: some basic frontend validation
  errors(): string {
    return "";
  }
}
