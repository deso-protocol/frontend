import { ApplicationRef, ChangeDetectorRef, Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, BackendRoutes } from "../../backend-api.service";
import { sprintf } from "sprintf-js";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import Swal from "sweetalert2";
import { IdentityService } from "../../identity.service";
import { BuyDeSoComponent } from "../buy-deso/buy-deso.component";

class Messages {
  static INCORRECT_PASSWORD = `The password you entered was incorrect.`;
  static INSUFFICIENT_BALANCE = `Your balance is insufficient to complete the transaction.`;
  static INSUFFICIENT_FEES = `Your purchase is insufficient to cover the transaction fees.`;
  static CONNECTION_PROBLEM = `We had a problem processing your transaction. Please wait a few minutes and try again.`;
  static UNKOWN_PROBLEM = `There was a weird problem with the transaction. Debug output: %s`;
  static NOT_MINED = `Your ETH is still mining. Please try again in one minute.`;

  static CONFIRM_BUY_DESO = `Are you ready to exchange %s ETH for %s DESO?`;
  static ZERO_DESO_ERROR = `You must purchase a non-zero amount DESO`;
  static NEGATIVE_DESO_ERROR = `You must purchase a non-negative amount of DESO`;
}

@Component({
  selector: "buy-deso-eth",
  templateUrl: "./buy-deso-eth.component.html",
  styleUrls: ["./buy-deso-eth.component.scss"],
})
export class BuyDeSoEthComponent implements OnInit {
  @Input() parentComponent: BuyDeSoComponent;

  buyWithEthStep = 1;
  keyIsCopied = false;

  // Current balance in ETH
  ethBalance = 0;
  loadingBalance = false;

  // Network fees in ETH (with sane default)
  ethFeeEstimate = 0.002;

  // ETH to exchange (not including fees)
  ethToExchange = 0;

  // DESO to Buy
  desoToBuy = 0;

  // User errors
  error = "";

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private identityService: IdentityService
  ) {}

  _copyPublicKey() {
    this.globalVars._copyText(this.ethDepositAddress());
    this.keyIsCopied = true;
    setInterval(() => {
      this.keyIsCopied = false;
    }, 1000);
  }

  ethDepositAddress(): string {
    const pubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    const user = this.identityService.identityServiceUsers[pubKey];
    const ethAddress = user?.ethDepositAddress;

    if (ethAddress != null && user.version >= 1) {
      return ethAddress;
    } else {
      return "Please re-login to generate an ETH address";
    }
  }

  stepOneTooltip() {
    return (
      "DESO can be purchased in just a few minutes using ETH.\n\n" +
      "To get started, simply send ETH to your deposit address below. Note that deposits should show up " +
      "within thirty seconds or so but sometimes, for various technical reasons, it can take up to an hour " +
      "(though this should be extremely rare).\n\n" +
      "Once you've deposited ETH, you can swap it for DESO in step two below. If it's your first " +
      "time doing this, we recommend starting with a small test amount of ETH to get comfortable with the flow."
    );
  }

  depositEthTooltip() {
    return "Send ETH to this address so that you can swap it for DESO in step two below.";
  }

  minDepositTooltip() {
    return (
      "This is the minimum amount required to cover the Ethereum " +
      "network fees associated with your purchase. We would love to make this " +
      "lower, but if we did then the Ethereum network would reject your transaction."
    );
  }

  withdrawEthTooltip() {
    return (
      "If you send too much ETH to your deposit address and need to get it back, you " +
      "can access the ETH in this address by importing your Seed Hex into most standard Ethereum wallets. " +
      "We don't display this easily for security purposes. To see your Seed Hex open your browser's developer " +
      "tools, then select Storage -> DeSo Identity -> Users -> Public Key -> Seed Hex."
    );
  }

  balanceUpdateTooltip() {
    return (
      "Normally, when you send ETH to the deposit address, it will show up instantly. " +
      "However, it can take up to an hour in rare cases depending on where you send it from."
    );
  }

  ethereumNetworkFeeTooltip() {
    return (
      "The process of exchanging ETH for DESO requires posting a transaction to " +
      "the Ethereum blockchain. For this reason, we must add a network fee to " +
      "incentivize miners to process the transaction."
    );
  }

  clickBuyDESO() {
    if (this.globalVars == null || this.globalVars.loggedInUser == null) {
      return;
    }

    if (this.desoToBuy === 0) {
      this.globalVars._alertError(Messages.ZERO_DESO_ERROR);
      return;
    }

    if (this.desoToBuy < 0) {
      this.globalVars._alertError(Messages.NEGATIVE_DESO_ERROR);
      return;
    }

    if (this.ethToExchange > this.ethBalance) {
      this.globalVars._alertError(Messages.INSUFFICIENT_BALANCE);
      return;
    }

    if (this.ethToExchange < this.ethFeeEstimate) {
      this.globalVars._alertError(Messages.INSUFFICIENT_FEES);
      return;
    }

    if (this.error != null && this.error !== "") {
      this.globalVars._alertError(this.error);
      return;
    }

    let confirmBuyDESOString = sprintf(Messages.CONFIRM_BUY_DESO, this.ethToExchange, this.desoToBuy);

    SwalHelper.fire({
      target: this.globalVars.getTargetComponentSelector(),
      title: "Are you ready?",
      html: confirmBuyDESOString,
      showCancelButton: true,
      customClass: {
        confirmButton: "btn btn-light",
        cancelButton: "btn btn-light no",
      },
      reverseButtons: true,
    }).then((res: any) => {
      if (res.isConfirmed) {
        // Execute the buy
        this.parentComponent.waitingOnTxnConfirmation = true;
        this.backendApi
          .ExchangeETH(
            this.globalVars.localNode,
            this.globalVars.loggedInUser.PublicKeyBase58Check,
            this.ethDepositAddress(),
            Math.floor(this.ethToExchange * GlobalVarsService.WEI_PER_ETH)
          )
          .subscribe(
            (res) => {
              // Reset all the form fields
              this.error = "";
              this.desoToBuy = 0;
              this.ethToExchange = 0;

              // This will update the balance and a bunch of other things.
              this.globalVars.updateEverything(
                res.DESOTxHash,
                this.parentComponent._clickBuyDeSoSuccess,
                this.parentComponent._clickBuyDeSoSuccessButTimeout,
                this.parentComponent
              );
            },
            (err) => {
              this.globalVars.logEvent("bitpop : buy : error");
              this.parentComponent._clickBuyDeSoFailure(this.parentComponent, this.extractError(err));
            }
          );
      }
    });
  }

  extractError(err: any): string {
    if (err.error != null && err.error.error != null) {
      let rawError = err.error.error;
      if (rawError.includes("Not enough funds")) {
        return Messages.INSUFFICIENT_BALANCE;
      } else if (rawError.includes("Failed to create fee transaction")) {
        return Messages.NOT_MINED;
      } else {
        return rawError;
      }
    }
    if (err.status != null && err.status != 200) {
      return Messages.CONNECTION_PROBLEM;
    }
    // If we get here we have no idea what went wrong so just return the
    // errorString.
    return sprintf(Messages.UNKOWN_PROBLEM, JSON.stringify(err));
  }

  clickMaxDESO() {
    this.ethToExchange = this.ethBalance;
    this.updateETHToExchange(this.ethToExchange);
  }

  computeETHToBurnGivenDESONanos(amountNanos: number) {
    const ethMinusFees = amountNanos / (this.globalVars.nanosPerETHExchangeRate * this.nodeFee());
    return ethMinusFees + this.ethFeeEstimate;
  }

  computeNanosToCreateGivenETHToBurn(ethToBurn: number): number {
    const ethMinusFees = Math.max(ethToBurn - this.ethFeeEstimate, 0);
    return ethMinusFees * (this.globalVars.nanosPerETHExchangeRate * this.nodeFee());
  }

  updateDESOToBuy(newVal) {
    if (newVal == null || newVal === "") {
      this.desoToBuy = 0;
      this.ethToExchange = 0;
    } else {
      // Convert the string value to a number
      this.desoToBuy = Number(this.desoToBuy);

      // Update the other value
      this.ethToExchange = this.computeETHToBurnGivenDESONanos(newVal * GlobalVarsService.NANOS_PER_UNIT);
    }
  }

  updateETHToExchange(newVal) {
    if (newVal == null || newVal === "") {
      this.desoToBuy = 0;
      this.ethToExchange = 0;
    } else {
      // Convert the string value to a number
      this.ethToExchange = Number(this.ethToExchange);

      // Update the other value
      this.desoToBuy =
        this.computeNanosToCreateGivenETHToBurn(this.ethToExchange) / GlobalVarsService.NANOS_PER_UNIT;
    }
  }

  nodeFee(): number {
    return 1 + this.globalVars.BuyDeSoFeeBasisPoints / (100 * 100);
  }

  refreshBalance() {
    if (this.loadingBalance) {
      return;
    }

    this.loadingBalance = true;

    this.backendApi.GetETHBalance(this.globalVars.localNode, this.ethDepositAddress()).subscribe(
      (res: any) => {
        this.loadingBalance = false;
        this.ethBalance = res.Balance / GlobalVarsService.WEI_PER_ETH;
        this.ethFeeEstimate = res.Fees / GlobalVarsService.WEI_PER_ETH;
        this.ethToExchange = this.ethFeeEstimate;
      },
      (error) => {
        this.loadingBalance = false;
        console.error("Error getting ETH Balance data: ", error);
      }
    );
  }

  ngOnInit() {
    window.scroll(0, 0);

    this.refreshBalance();

    // Force an update of the exchange rate when loading the Buy DESO page to ensure our computations are using the latest rates.
    this.globalVars._updateDeSoExchangeRate();
  }
}
