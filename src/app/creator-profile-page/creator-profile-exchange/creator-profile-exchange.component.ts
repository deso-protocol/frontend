import { Component, Input } from "@angular/core";
import {BackendApiService, ProfileEntryResponse, BalanceEntryResponse, BackendRoutes} from "../../backend-api.service";
import { GlobalVarsService } from "../../global-vars.service";
import { IDatasource, IAdapter } from "ngx-ui-scroll";
import { InfiniteScroller } from "src/app/infinite-scroller";
import { Hex } from "web3-utils/types";

@Component({
  selector: "creator-profile-exchange",
  templateUrl: "./creator-profile-exchange.component.html",
  styleUrls: ["./creator-profile-exchange.component.scss"],
})
export class CreatorProfileExchangeComponent {
  static PAGE_SIZE = 100;
  static WINDOW_VIEWPORT = true;
  static BUFFER_SIZE = 5; // todo anna: do we want 5 or default?

  constructor(private globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  @Input() profile: ProfileEntryResponse;

  lastPage = null;
  loadingFirstPage = true;
  loadingNextPage = false;

  orderPrice = 0;
  orderQuantity = 0;
  orderSide = "BID"

  submitOrder(): void {
    const buyingDAOCoinCreator = this.orderSide == "BID" ? this.profile.Username : "";
    const sellingDAOCoinCreator = this.orderSide == "BID" ? "" : this.profile.Username;

    const exchangeRateCoinsToSellPerCoinsToBuy = this.orderSide == "BID" ? this.orderPrice : 1 / this.orderPrice;
    const quantityToBuy = this.orderSide == "BID" ? this.orderQuantity : this.orderQuantity * this.orderPrice;

    this.backendApi
      .CreateDAOCoinLimitOrder(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        buyingDAOCoinCreator,
        sellingDAOCoinCreator,
        exchangeRateCoinsToSellPerCoinsToBuy,
        quantityToBuy,
        this.globalVars.defaultFeeRateNanosPerKB,
      )
      .subscribe(
        (res) => {
          console.log(res)
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => {});
  }

  cancelOrder(
    buyingDAOCoinCreator: string,
    sellingDAOCoinCreator : string,
    exchangeRateCoinsToSellPerCoinsToBuy: Hex,
    quantityToBuyInBaseUnits: Hex,
  ): void {
    this.backendApi
      .CancelDAOCoinLimitOrder(
        this.globalVars.localNode,
        this.globalVars.loggedInUser?.PublicKeyBase58Check,
        buyingDAOCoinCreator,
        sellingDAOCoinCreator,
        exchangeRateCoinsToSellPerCoinsToBuy,
        quantityToBuyInBaseUnits,
        this.globalVars.defaultFeeRateNanosPerKB,
      )
      .subscribe(
        (res) => {
          console.log(res)
        },
        (err) => {
          console.error(err);
        }
      )
      .add(() => {});
  }

  getPage(page: number) {
    this.loadingNextPage = true;
    return this.backendApi
      .GetDAOCoinLimitOrders(
        this.globalVars.localNode,
        this.profile.Username,
        "",
      )
      .toPromise()
      .then((res) => {
        this.loadingNextPage = false;
        this.loadingFirstPage = false;

        return res.Orders.map(order => {
          const price = order.BuyingDAOCoinCreatorPublicKeyBase58Check != "" ?
              order.ExchangeRateCoinsToSellPerCoinToBuy :
              1 / order.ExchangeRateCoinsToSellPerCoinToBuy;
          const quantity = order.BuyingDAOCoinCreatorPublicKeyBase58Check != "" ?
            order.QuantityToBuy :
            order.ExchangeRateCoinsToSellPerCoinToBuy * order.QuantityToBuy;

          const canCancel = order.TransactorPublicKeyBase58Check == this.globalVars.loggedInUser?.PublicKeyBase58Check

          return {
            Price : price,
            Quantity : quantity,
            Side : order.BuyingDAOCoinCreatorPublicKeyBase58Check != "" ? "BID" : "ASK",

            TransactorPublicKeyBase58Check: order.TransactorPublicKeyBase58Check,
            BuyingDAOCoinCreatorPublicKeyBase58Check : order.BuyingDAOCoinCreatorPublicKeyBase58Check,
            SellingDAOCoinCreatorPublicKeyBase58Check: order.SellingDAOCoinCreatorPublicKeyBase58Check,
            ScaledExchangeRateCoinsToSellPerCoinToBuy : order.ScaledExchangeRateCoinsToSellPerCoinToBuy,
            QuantityToBuyInBaseUnits: order.QuantityToBuyInBaseUnits,

            Cancel: !canCancel ? null : () => {
              this.cancelOrder(
                order.BuyingDAOCoinCreatorPublicKeyBase58Check,
                order.SellingDAOCoinCreatorPublicKeyBase58Check,
                order.ScaledExchangeRateCoinsToSellPerCoinToBuy,
                order.QuantityToBuyInBaseUnits,
              )
            }
          }
        }).sort((a, b) => b.Price - a.Price);
      });
  }

  isRowForCreator(row: BalanceEntryResponse) {
    return row.CreatorPublicKeyBase58Check == row.HODLerPublicKeyBase58Check;
  }

  usernameStyle() {
    return {
      "max-width": this.globalVars.isMobile() ? "100px" : "200px",
    };
  }

  getTooltipForRow(row: BalanceEntryResponse): string {
    if (
      row.HODLerPublicKeyBase58Check === this.profile.PublicKeyBase58Check &&
      row.ProfileEntryResponse.IsReserved &&
      !row.ProfileEntryResponse.IsVerified
    ) {
      return `These creator coins are reserved for ${this.profile.Username}`;
    }
    return row.HasPurchased
      ? `This user has purchased some amount of $${this.profile.Username} coin.`
      : `This user has not purchased $${this.profile.Username} coin.
      The user has only received these creator coins from transfers.
      Buying any amount of this coin will change the status to "purchased."`;
  }

  stopEvent(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  infiniteScroller: InfiniteScroller = new InfiniteScroller(
    CreatorProfileExchangeComponent.PAGE_SIZE,
    this.getPage.bind(this),
    CreatorProfileExchangeComponent.WINDOW_VIEWPORT,
    CreatorProfileExchangeComponent.BUFFER_SIZE
  );
  datasource: IDatasource<IAdapter<any>> = this.infiniteScroller.getDatasource();
}
