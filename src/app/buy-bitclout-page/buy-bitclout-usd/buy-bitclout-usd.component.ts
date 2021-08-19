import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { HttpClient } from "@angular/common/http";
import { WyreService } from "../../../lib/services/wyre/wyre";
import { IdentityService } from "../../identity.service";
import { BackendApiService } from "../../backend-api.service";
import * as _ from "lodash";
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from "@angular/router";
import { SwalHelper } from "../../../lib/helpers/swal-helper";
import { FeedComponent } from "../../feed/feed.component";
import currencyToSymbolMap from "currency-symbol-map/map";

@Component({
  selector: "buy-bitclout-usd",
  templateUrl: "./buy-bitclout-usd.component.html",
  styleUrls: ["./buy-bitclout-usd.component.scss"],
})
export class BuyBitcloutUSDComponent implements OnInit {
  wyreService: WyreService;

  amount = 99;
  quotation: any;
  bitcloutReceived: string;
  fees: number;

  debouncedGetQuotation: () => void;

  maxUsdAmount = 450;

  usdEquivalent: number;
  supportedCountries: string[];
  supportedFiatCurrencies: { [k: string]: string };

  selectedFiatCurrency = "USD";
  selectedFiatCurrencySymbol = "$";
  selectedCountry = "US";

  quotationError: string = "";
  reservationError: string = "";

  constructor(
    private globalVars: GlobalVarsService,
    private httpClient: HttpClient,
    private identityService: IdentityService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.wyreService = new WyreService(this.httpClient, this.globalVars, this.backendApi);
    this.supportedFiatCurrencies = this.wyreService.getSupportedFiatCurrencies();
    this.wyreService.getSupportedCountries().subscribe((res) => {
      this.supportedCountries = res;
    });
    this.debouncedGetQuotation = _.debounce(this._refreshQuotation.bind(this), 300);
    this.route.queryParams.subscribe((queryParams) => {
      if (queryParams.destAmount) {
        this.globalVars.logEvent("wyre : buy : success", queryParams);
        const btcPurchased = queryParams.destAmount;
        this.globalVars.celebrate();
        SwalHelper.fire({
          target: this.globalVars.getTargetComponentSelector(),
          icon: "success",
          title: `Purchase Completed`,
          html: `Your purchase of approximately ${this.getBitCloutReceived(btcPurchased).toFixed(
            4
          )} BitClout was successful. It may take a few minutes to appear in your wallet.`,
          showConfirmButton: true,
          showCancelButton: true,
          reverseButtons: true,
          customClass: {
            confirmButton: "btn btn-light",
            cancelButton: "btn btn-light no",
          },
          confirmButtonText: "Continue to Feed ",
          cancelButtonText: "Buy More",
        }).then((res) => {
          queryParams = {};
          if (res.isConfirmed) {
            this.router.navigate(["/" + globalVars.RouteNames.BROWSE], {
              queryParams: { feedTab: FeedComponent.GLOBAL_TAB },
            });
          } else {
            this.router.navigate([], { queryParams: {} });
          }
        });
      }
    });
  }

  ngOnInit() {
    this._refreshQuotation();
  }

  onBuyClicked(): void {
    if (this.quotationError) {
      return;
    }
    this.wyreService.makeWalletOrderReservation(this.amount, this.selectedCountry, this.selectedFiatCurrency).subscribe(
      (res) => {
        const wyreUrl = res.url;
        if (res.url) {
          Swal.fire({
            target: this.globalVars.getTargetComponentSelector(),
            title: "Purchase BitClout",
            html: `You will complete your purchase through Wyre. Your ${this.selectedFiatCurrency} will be converted to <b>Bitcoin</b> and then into <b>BitClout</b> automatically.`,
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
              this.globalVars.logEvent("wyre : buy", { amount: this.amount });
              window.open(wyreUrl);
            }
          });
        } else {
          this.reservationError = res.message;
          this.globalVars._alertError(res.message);
        }
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
    this.fees = null;
    this.quotation = null;
    this.usdEquivalent = null;
    this.quotationError = "";
    this.wyreService.makeWalletOrderQuotation(this.amount, this.selectedCountry, this.selectedFiatCurrency).subscribe(
      (res) => {
        this.parseQuotation(res);
      },
      (err) => {
        this.quotationError = err.error.message;
      }
    );
  }

  parseQuotation(quotation: any): void {
    if (quotation.errorCode || quotation.message) {
      this.quotationError = quotation.message;
      return;
    }
    this.quotation = quotation;
    this.usdEquivalent = this.getUSDEquivalent(quotation);

    if (this.usdEquivalent > this.maxUsdAmount) {
      this.quotationError = `Maximum purchase amount is ${this.maxUsdAmount} USD`;
      return;
    }
    this.bitcloutReceived = this.getBitCloutReceived(quotation.destAmount).toFixed(4);
    this.fees = quotation.sourceAmount - quotation.sourceAmountWithoutFees;
  }

  getBitCloutReceived(btcReceived: number): number {
    return (
      (btcReceived * 1e8) /
      (this.globalVars.satoshisPerBitCloutExchangeRate * (1 + this.globalVars.BuyBitCloutFeeBasisPoints / (100 * 100)))
    );
  }

  onSelectFiatCurrency(event): void {
    this.selectedFiatCurrency = event;
    this.selectedFiatCurrencySymbol = currencyToSymbolMap[event];
    this._refreshQuotation();
  }

  onSelectCountry(event): void {
    this.selectedCountry = event;
    this._refreshQuotation();
  }

  getUSDEquivalent(quotation: any) {
    return quotation.equivalencies.USD;
  }
}
