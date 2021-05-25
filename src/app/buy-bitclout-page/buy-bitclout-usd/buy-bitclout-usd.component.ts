import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

import { HttpClient } from "@angular/common/http";
import { WyreService } from "../../../lib/services/wyre/wyre";
import { IdentityService } from "../../identity.service";
import { BackendApiService } from "../../backend-api.service";

@Component({
  selector: "buy-bitclout-usd",
  templateUrl: "./buy-bitclout-usd.component.html",
  styleUrls: ["./buy-bitclout-usd.component.scss"],
})
export class BuyBitcloutUSDComponent {
  wyreService: WyreService;

  amount: number;
  quotation: any;
  bitcloutReceived: number;
  usdFees: number;
  constructor(
    private globalVars: GlobalVarsService,
    private httpClient: HttpClient,
    private identityService: IdentityService,
    private backendApi: BackendApiService
  ) {
    this.wyreService = new WyreService(this.httpClient, this.globalVars, this.backendApi);
  }

  onBuyClicked(): void {
    this.wyreService.makeWalletOrderReservation(this.amount).subscribe(
      (res) => {
        window.open(res.url);
      },
      (err) => {
        this.globalVars._alertError(err.error.message);
      }
    );
  }

  updateQuotation(): void {
    this.bitcloutReceived = null;
    this.usdFees = null;
    this.quotation = null;
    this.wyreService.makeWalletOrderQuotation(this.amount).subscribe(
      (res) => {
        this.parseQuotation(res);
      },
      (err) => {
        this.globalVars._alertError(err.error.message);
      }
    );
  }

  parseQuotation(quotation: any): void {
    this.quotation = quotation;
    const btcReceived = quotation.destAmount;
    this.bitcloutReceived = (btcReceived * 1e8) / (this.globalVars.satoshisPerBitCloutExchangeRate * 1.01);
    this.usdFees = quotation.fees.USD;
  }
}
