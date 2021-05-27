import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { HttpClient } from "@angular/common/http";
import { WyreService } from "../../../lib/services/wyre/wyre";
import { IdentityService } from "../../identity.service";
import { BackendApiService } from "../../backend-api.service";
import * as _ from "lodash";
import Swal from "sweetalert2";
import { ActivatedRoute } from "@angular/router";
import { SwalHelper } from "../../../lib/helpers/swal-helper";

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

  debouncedGetQuotation: () => void;

  constructor(
    private globalVars: GlobalVarsService,
    private httpClient: HttpClient,
    private identityService: IdentityService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute
  ) {
    this.wyreService = new WyreService(this.httpClient, this.globalVars, this.backendApi);
    this.debouncedGetQuotation = _.debounce(this._refreshQuotation.bind(this), 300);
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.destAmount) {
        const btcPurchased = queryParams.destAmount;
        SwalHelper.fire({
          icon: "success",
          title: `Purchase Completed`,
          html: `Your purchase of approximately ${this.getBitCloutReceived(btcPurchased).toFixed(
            4
          )} BitClout was successful. It may take a few minutes to appear in your wallet.`,
          showConfirmButton: true,
          focusConfirm: true,
          customClass: {
            confirmButton: "btn btn-light",
          },
          confirmButtonText: "Ok",
        });
      }
    });
  }

  onBuyClicked(): void {
    this.wyreService.makeWalletOrderReservation(this.amount).subscribe(
      (res) => {
        const wyreUrl = res.url;
        Swal.fire({
          title: "Purchase BitClout",
          html:
            "You will complete your purchase through Wyre. Your USD will be converted to <b>Bitcoin</b> and then into <b>BitClout</b> automatically.",
          showCancelButton: true,
          showConfirmButton: true,
          confirmButtonText: "Buy",
          customClass: {
            confirmButton: "btn btn-light",
            cancelButton: "btn btn-light no",
          },
          reverseButtons: true,
        }).then((res: any) => {
          if (res.isConfirmed) {
            window.open(wyreUrl);
          }
        });
      },
      (err) => {
        this.globalVars._alertError(err.error.message);
      }
    );
  }

  updateQuotation(): void {
    this.debouncedGetQuotation();
  }

  _refreshQuotation(): void {
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
    if (quotation.errorCode) {
      this.globalVars._alertError("Error: " + quotation.message);
      return;
    }
    this.quotation = quotation;
    this.bitcloutReceived = this.getBitCloutReceived(quotation.destAmount);
    this.usdFees = quotation.fees.USD;
  }

  getBitCloutReceived(btcReceived: number): number {
    return (btcReceived * 1e8) / (this.globalVars.satoshisPerBitCloutExchangeRate * 1.01);
  }
}
