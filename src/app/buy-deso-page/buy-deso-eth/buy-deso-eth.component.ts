import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { sprintf } from "sprintf-js";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { IdentityService } from "../../identity.service";
import { BuyDeSoComponent } from "../buy-deso/buy-deso.component";
import { fromWei, hexToNumber, toHex } from "web3-utils";
import { Hex } from "web3-utils/types";
import Common, { Chain, Hardfork } from "@ethereumjs/common";
import { FeeMarketEIP1559Transaction, Transaction as LegacyTransaction, TxData, TxOptions } from "@ethereumjs/tx";
import { FeeMarketEIP1559TxData } from "@ethereumjs/tx/src/types";
import { Transaction } from "ethereumjs-tx";

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
  static RPC_ERROR = `RPC Error`;
}

type SignedTransaction<TransactionType> = {
  signedTx: TransactionType;
  toSign: string[];
};

type TransactionType = Transaction | LegacyTransaction | FeeMarketEIP1559Transaction;

type TypeOfTransactionType = typeof Transaction | typeof LegacyTransaction | typeof FeeMarketEIP1559Transaction;

type FeeDetails = {
  baseFeePerGas?: number;
  maxPriorityFeePerGas?: number;
  maxPriorityFeePerGasHex?: Hex;
  maxFeePerGas?: number;
  maxFeePerGasHex?: Hex;
  totalFees: number;
  gasPriceHex?: Hex;
  gasPrice?: number;
};

@Component({
  selector: "buy-deso-eth",
  templateUrl: "./buy-deso-eth.component.html",
  styleUrls: ["./buy-deso-eth.component.scss"],
})
export class BuyDeSoEthComponent implements OnInit {
  @Input() parentComponent: BuyDeSoComponent;

  // Current balance in ETH
  ethBalance = 0;
  loadingBalance = false;
  loadingFee = false;

  // Network fees in ETH (with sane default)
  ethFeeEstimate = 0.002;

  // ETH to exchange (not including fees)
  ethToExchange = 0;

  // DESO to Buy
  desoToBuy = 0;

  // User errors
  error = "";

  common: Common;

  static instructionsPerBasicTransfer = 21000;

  static useLegacyTransaction: boolean = true;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private identityService: IdentityService
  ) {}

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
        return this.signAndSubmitETH(true);
      }
    });
  }

  signAndSubmitETH(retry: boolean = false): Promise<any> {
    return (BuyDeSoEthComponent.useLegacyTransaction
      ? this.constructLegacyTransactionOld()
      : this.constructFeeMarketTransaction()
    ).then((res) => {
      if (!res?.signedTx) {
        console.error("No signedTx found - aborting");
        return;
      }
      const signedHash = res.signedTx.serialize().toString("hex");
      // Submit the transaction.
      this.parentComponent.waitingOnTxnConfirmation = true;
      this.backendApi
        .SubmitETHTx(
          this.globalVars.localNode,
          this.globalVars.loggedInUser.PublicKeyBase58Check,
          res.signedTx,
          res.toSign,
          [signedHash]
        )
        .subscribe(
          (res) => {
            this.globalVars.logEvent("deso : buy : eth");
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
            this.globalVars.logEvent("deso : buy : eth : error");
            if (err.error?.error && err.error?.error.includes("RPC Error") && retry) {
              console.error(err);
              this.globalVars.logEvent("deso : buy : eth : retry");
              // Sometimes fees will change between the time they were fetched and the transaction was broadcasted.
              // To combat this, we will retry by fetching fees again and constructing/signing/broadcasting the
              // transaction again.
              return this.signAndSubmitETH(false);
            } else {
              this.parentComponent._clickBuyDeSoFailure(this.parentComponent, this.extractError(err));
            }
          }
        );
    });
  }

  // constructFeeMarketTransaction creates a Signed EIP-1559 transaction with maxPriorityFeePerGas and maxFeePerGas
  // using the maintained ethereumjs/tx library. Sometimes EIP-1559 transactions are taking too long to mine or are not
  // mining at all due to gas calculations so this function is not currently used. Upgrading to using this function in
  // the future is preferred as we'll lower the amount of gas paid per transaction.
  constructFeeMarketTransaction(): Promise<SignedTransaction<TransactionType>> {
    return this.generateSignedTransaction<FeeMarketEIP1559Transaction>(FeeMarketEIP1559Transaction);
  }

  // constructLegacyTransaction creates a Signed Legacy transaction with gasPrice using the maintained ethereumjs/tx
  // library. There is an issue generating a valid signature for legacy transactions using the new library so this
  // is not actively used. However, upgrading to using this once that is resolved would be preferred as the old
  // ethereumjs-tx library is no longer maintained.
  constructLegacyTransaction(): Promise<SignedTransaction<TransactionType>> {
    return this.generateSignedTransaction<LegacyTransaction>(LegacyTransaction);
  }

  // constructLegacyTransactionOld creates a LegacyTransaction using the deprecated ethereum-tx library. This deprecated
  // library is being used as the updated version of this library causes issues generating a valid signature in identity
  // for legacy transactions. In the future, we should move to using constructFeeMarketTransaction.
  constructLegacyTransactionOld(): Promise<SignedTransaction<TransactionType>> {
    return this.generateSignedTransaction<Transaction>(Transaction);
  }

  // generateSignedTransaction is a generic function that given any type of Transaction will construct an unsigned
  // transaction with the appropriate transaction data and sign it using identity.
  generateSignedTransaction<Type extends TransactionType>(
    type: TypeOfTransactionType
  ): Promise<SignedTransaction<Type>> {
    return this.getNonceValueAndFees().then(([nonce, value, fees]) => {
      let txData: TxData;
      let feeMarketTxData: FeeMarketEIP1559TxData;
      txData = {
        nonce,
        value,
        data: "0x",
        gasLimit: toHex(BuyDeSoEthComponent.instructionsPerBasicTransfer),
        to: this.globalVars.buyETHAddress,
      };
      if (BuyDeSoEthComponent.useLegacyTransaction) {
        txData.gasPrice = fees.gasPriceHex;
      } else {
        feeMarketTxData = txData as FeeMarketEIP1559TxData;
        feeMarketTxData.maxPriorityFeePerGas = fees.maxPriorityFeePerGasHex;
        feeMarketTxData.maxFeePerGas = fees.maxFeePerGasHex;
        feeMarketTxData.chainId = toHex(this.getChain());
      }
      let toSign: string[];
      switch (type) {
        case Transaction: {
          let tx = new Transaction(txData, this.getOldOptions());
          // Poached from the sign method on Transaction in deprecated ethereumjs-tx library which demonstrates how to
          // get the equivalent of getMessageToSign in the new ethereumjs tx library.
          const buffer_1 = require("buffer");
          tx.v = new buffer_1.Buffer([]);
          tx.r = new buffer_1.Buffer([]);
          tx.s = new buffer_1.Buffer([]);
          toSign = [tx.hash(false).toString("hex")];
          break;
        }
        case LegacyTransaction: {
          // Generate an Unsigned Legacy Transaction from the data and generated a hash message to sign.
          const tx = LegacyTransaction.fromTxData(txData, { common: this.common });
          toSign = [tx.getMessageToSign(true).toString("hex")];
          break;
        }
        case FeeMarketEIP1559Transaction: {
          // Generate an Unsigned EIP 1559 Fee Market Transaction from the data and generated a hash message to sign.
          let tx = FeeMarketEIP1559Transaction.fromTxData(feeMarketTxData, { common: this.common });
          toSign = [tx.getMessageToSign(true).toString("hex")];
          break;
        }
      }
      return this.getSignedTransactionFromUnsignedHex<Type>(
        type === FeeMarketEIP1559Transaction ? feeMarketTxData : txData,
        toSign,
        type
      );
    });
  }

  // getNonceValueAndFees is a helper to get the nonce, transaction value, and current fees when constructing a tx.
  getNonceValueAndFees(): Promise<[Hex, Hex, FeeDetails]> {
    return Promise.all([this.getTransactionCount(this.ethDepositAddress(), "pending"), this.getFees()]).then(
      ([transactionCount, fees]) => {
        const nonce = toHex(transactionCount);
        let value = this.getValue(fees.totalFees);
        return [nonce, value, fees];
      }
    );
  }

  // getSignedTransactionFromUnsignedHex takes an unsigned transaction, signs it, and returns the requested type of
  // Transaction.
  getSignedTransactionFromUnsignedHex<Type extends TransactionType>(
    txData: TxData | FeeMarketEIP1559TxData,
    toSign: string[],
    signedTxType: TypeOfTransactionType
  ): Promise<SignedTransaction<Type>> {
    return this.identityService
      .signETH({
        ...this.identityService.identityServiceParamsForKey(this.globalVars.loggedInUser.PublicKeyBase58Check),
        unsignedHashes: toSign,
      })
      .toPromise()
      .then(
        (res) => {
          // Get the signature and merge it into the TxData defined above.
          const signature: { s: any; r: any; v: number | null } = res.signatures[0];
          // For Legacy transaction using the old library, we need to modify V to satisfy EIP 155 constraints.
          if (signedTxType === Transaction && this.common.gteHardfork("spuriousDragon")) {
            signature.v = signature.v === 0 ? this.getChain() * 2 + 35 : this.getChain() * 2 + 36;
          }
          // Merge the signature into the transaction data.
          const signedTxData = {
            ...txData,
            ...signature,
          };
          let signedTx: Transaction | LegacyTransaction | FeeMarketEIP1559Transaction;

          switch (signedTxType) {
            case Transaction: {
              // Create a signed Legacy transaction using the deprecated ethereumjs-tx library.
              signedTx = new Transaction(signedTxData, this.getOldOptions());
              break;
            }
            case LegacyTransaction: {
              // Create a signed Legacy transaction using the maintained ethereumjs/tx library.
              const legacyTxData = txData as TxData;
              signedTx = LegacyTransaction.fromTxData(legacyTxData, this.getOptions());
              break;
            }
            case FeeMarketEIP1559Transaction: {
              // Create a Fee Market EIP-1559 transaction using the maintained ethereumjs/tx library.
              const feeMarketTxdata = txData as FeeMarketEIP1559TxData;
              signedTx = FeeMarketEIP1559Transaction.fromTxData(feeMarketTxdata, this.getOptions());
              break;
            }
          }
          // Construct and serialize the transaction.
          return <SignedTransaction<Type>>{ signedTx, toSign };
        },
        (err) => {
          console.error(err);
          this.globalVars._alertError(err);
          return null;
        }
      );
  }

  getValue(totalFees: number): Hex {
    // Make sure that value + actual fees does not exceed the current balance. If it does, subtract the remainder from value.
    let value = Math.floor((this.ethToExchange - this.ethFeeEstimate) * 1e18);
    let remainder = totalFees + value - this.ethBalance * 1e18;
    if (remainder > 0) {
      value = value - remainder;
    }
    return toHex(value);
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
    this.getFees().then((res) => {
      this.ethFeeEstimate = this.fromWeiToEther(res.totalFees);
      this.ethToExchange = this.ethBalance;
      this.updateETHToExchange(this.ethToExchange);
    });
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
        this.computeNanosToCreateGivenETHToBurn(this.ethToExchange - this.ethFeeEstimate) /
        GlobalVarsService.NANOS_PER_UNIT;
    }
  }

  nodeFee(): number {
    return 1 + this.globalVars.BuyDeSoFeeBasisPoints / (100 * 100);
  }

  refreshBalance() {
    if (!this.loadingBalance) {
      this.loadingBalance = true;
      this.getBalance(this.ethDepositAddress(), "latest")
        .then((res) => {
          this.ethBalance = parseFloat(fromWei(res.toString(), "ether"));
        })
        .finally(() => {
          this.loadingBalance = false;
        });
    }
    if (!this.loadingFee) {
      this.loadingFee = true;
      this.getFees().then((res) => {
        this.ethFeeEstimate = this.fromWeiToEther(res.totalFees);
        this.ethToExchange = this.ethFeeEstimate;
      });
    }
  }

  queryETHRPC(method: string, params: any[]): Promise<any> {
    return this.backendApi
      .QueryETHRPC(this.globalVars.localNode, method, params, this.globalVars.loggedInUser?.PublicKeyBase58Check)
      .toPromise()
      .then(
        (res) => {
          return res.result;
        },
        (err) => {
          console.error(err);
        }
      );
  }

  // Get current gas price.
  getGasPrice(): Promise<any> {
    return this.queryETHRPC("eth_gasPrice", []);
  }

  // Gets the data about the pending block.
  getBlock(block: string): Promise<any> {
    return this.queryETHRPC("eth_getBlockByNumber", [block, false]);
  }

  getTransactionCount(address: string, block: string = "pending"): Promise<number> {
    return this.queryETHRPC("eth_getTransactionCount", [address, block]).then((result) => hexToNumber(result));
  }

  // Gets balance for address.
  getBalance(address: string, block: string = "latest"): Promise<any> {
    return this.queryETHRPC("eth_getBalance", [address, block]);
  }

  getMaxPriorityFeePerGas(): Promise<any> {
    return this.queryETHRPC("eth_maxPriorityFeePerGas", []);
  }

  // getFees returns all the numbers and hex-strings necessary for computing eth gas.
  getFees(): Promise<FeeDetails> {
    if (BuyDeSoEthComponent.useLegacyTransaction) {
      return this.getGasPrice().then((gasPriceHex) => {
        return {
          totalFees: hexToNumber(gasPriceHex) * BuyDeSoEthComponent.instructionsPerBasicTransfer,
          gasPriceHex,
          gasPrice: hexToNumber(gasPriceHex),
        };
      });
    }
    return Promise.all([this.getBlock("pending"), this.getMaxPriorityFeePerGas()]).then(
      ([block, maxPriorityFeePerGasHex]) => {
        const baseFeePerGas = hexToNumber((block as any).baseFeePerGas);

        const maxPriorityFeePerGas = hexToNumber(maxPriorityFeePerGasHex);
        const maxFeePerGas = baseFeePerGas + maxPriorityFeePerGas;
        const totalFees = maxFeePerGas * BuyDeSoEthComponent.instructionsPerBasicTransfer;
        return {
          baseFeePerGas,
          maxPriorityFeePerGas,
          maxPriorityFeePerGasHex,
          maxFeePerGas,
          maxFeePerGasHex: toHex(maxFeePerGas),
          totalFees,
        };
      }
    );
  }

  getChain(): Chain {
    return this.globalVars.isTestnet ? Chain.Ropsten : Chain.Mainnet;
  }

  getChainString(): string {
    return this.globalVars.isTestnet ? "ropsten" : "mainnet";
  }

  getHardfork(): Hardfork {
    return BuyDeSoEthComponent.useLegacyTransaction ? Hardfork.Petersburg : Hardfork.London;
  }

  getHardforkString(): string {
    return BuyDeSoEthComponent.useLegacyTransaction ? "petersburg" : "london";
  }

  getOptions(): TxOptions {
    return { common: this.common };
  }

  getOldOptions(): { chain: string; hardfork: string } {
    return { chain: this.getChainString(), hardfork: this.getHardforkString() };
  }

  ngOnInit() {
    window.scroll(0, 0);

    this.common = new Common({ chain: this.getChain(), hardfork: this.getHardfork() });

    this.refreshBalance();

    // Force an update of the exchange rate when loading the Buy DESO page to ensure our computations are using the latest rates.
    this.globalVars._updateDeSoExchangeRate();
  }

  fromWeiToEther(wei: number): number {
    return parseFloat(fromWei(toHex(wei)));
  }
}
