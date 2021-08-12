// TODO: creator coin buys: no-balance case is kinda dumb, we should have a module telling you to buy bitclout or
// creator coin

// TODO: creator coin buys: need warning about potential slippage

// TODO: creator coin buys: may need tiptips explaining why total != amount * currentPriceElsewhereOnSite

import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { AppRoutingModule } from "../../app-routing.module";
import { FollowService } from "../../../lib/services/follow/follow.service";

@Component({
  selector: "trade-creator",
  templateUrl: "./trade-creator.component.html",
  styleUrls: ["./trade-creator.component.scss"],
})
export class TradeCreatorComponent implements OnInit {
  TRADE_CREATOR_FORM_SCREEN = "trade_creator_form_screen";
  TRADE_CREATOR_PREVIEW_SCREEN = "trade_creator_preview_screen";
  TRADE_CREATOR_COMPLETE_SCREEN = "trade_creator_complete_screen";
  tabList = [CreatorCoinTrade.BUY_VERB, CreatorCoinTrade.SELL_VERB, CreatorCoinTrade.TRANSFER_VERB];

  router: Router;
  route: ActivatedRoute;
  appData: GlobalVarsService;
  creatorProfile;
  screenToShow: string = this.TRADE_CREATOR_FORM_SCREEN;

  isBuyingCreatorCoin: boolean;

  creatorCoinTrade: CreatorCoinTrade;

  // buy creator coin data
  bitCloutToSell: number;
  expectedCreatorCoinReturnedNanos: number;

  // sell creator coin data
  creatorCoinToSell: number;
  expectedBitCloutReturnedNanos: number;

  _onSlippageError() {
    this.screenToShow = this.TRADE_CREATOR_FORM_SCREEN;
    this.creatorCoinTrade.showSlippageError = true;
  }

  _onBackButtonClicked() {
    this.screenToShow = this.TRADE_CREATOR_FORM_SCREEN;
  }

  _onPreviewClicked() {
    this.screenToShow = this.TRADE_CREATOR_PREVIEW_SCREEN;
    this.creatorCoinTrade.showSlippageError = false;
  }

  _onTradeExecuted() {
    this.screenToShow = this.TRADE_CREATOR_COMPLETE_SCREEN;
  }

  readyForDisplay() {
    return (
      this.creatorProfile &&
      // USD calculations don't work correctly until we have the exchange rate
      this.appData.nanosPerUSDExchangeRate &&
      // Need to make sure the USD exchange rate is actually loaded, not a random default
      this.appData.nanosPerUSDExchangeRate != GlobalVarsService.DEFAULT_NANOS_PER_USD_EXCHANGE_RATE
    );
  }

  _handleTabClick(tab: string) {
    // Reset the creator coin trade as needed.
    this.creatorCoinTrade.amount.reset();
    this.creatorCoinTrade.clearAllFields();
    this.creatorCoinTrade.setTradeType(tab);
    this.creatorCoinTrade.selectedCurrency = this.creatorCoinTrade.defaultCurrency();

    // Reset us back to the form page.
    this.screenToShow = this.TRADE_CREATOR_FORM_SCREEN;

    // Swap out the URL.
    let newRoute = AppRoutingModule.buyCreatorPath(this.route.snapshot.params.username);
    if (tab === CreatorCoinTrade.SELL_VERB) {
      newRoute = AppRoutingModule.sellCreatorPath(this.route.snapshot.params.username);
    } else if (tab === CreatorCoinTrade.TRANSFER_VERB) {
      newRoute = AppRoutingModule.transferCreatorPath(this.route.snapshot.params.username);
    }
    this.router.navigate([newRoute], { queryParamsHandling: "merge" });
  }

  _setStateFromActivatedRoute(route) {
    // get the username of the creator
    let creatorUsername = route.snapshot.params.username;
    let tradeType = route.snapshot.params.tradeType;
    if (!this.creatorProfile || creatorUsername != this.creatorProfile.Username) {
      this._getCreatorProfile(creatorUsername);
    }

    switch (tradeType) {
      case this.appData.RouteNames.TRANSFER_CREATOR: {
        this.creatorCoinTrade.isBuyingCreatorCoin = false;
        this.creatorCoinTrade.tradeType = CreatorCoinTrade.TRANSFER_VERB;
        break;
      }
      case this.appData.RouteNames.BUY_CREATOR: {
        this.creatorCoinTrade.isBuyingCreatorCoin = true;
        this.creatorCoinTrade.tradeType = CreatorCoinTrade.BUY_VERB;
        break;
      }
      case this.appData.RouteNames.SELL_CREATOR: {
        this.creatorCoinTrade.isBuyingCreatorCoin = false;
        this.creatorCoinTrade.tradeType = CreatorCoinTrade.SELL_VERB;
        break;
      }
      default: {
        console.error(`unexpected path in _setStateFromActivatedRoute: ${tradeType}`);
        // TODO: creator coin buys: rollbar
      }
    }
  }

  _getCreatorProfile(creatorUsername) {
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }
    this.backendApi.GetSingleProfile(this.globalVars.localNode, "", creatorUsername).subscribe(
      (response) => {
        if (!response || !response.Profile) {
          this.router.navigateByUrl("/" + this.appData.RouteNames.NOT_FOUND, { skipLocationChange: true });
          return;
        }
        let profile = response.Profile;
        this.creatorCoinTrade.creatorProfile = profile;
        this.creatorProfile = profile;
      },
      (err) => {
        console.error(err);
        console.log("This profile was not found. It either does not exist or it was deleted."); // this.backendApi.parsePostError(err)
      }
    );
  }

  constructor(
    private globalVars: GlobalVarsService,
    private _route: ActivatedRoute,
    private _router: Router,
    private backendApi: BackendApiService,
  ) {
    this.appData = globalVars;
    this.router = _router;
    this.route = _route;
  }

  ngOnInit() {
    this.creatorCoinTrade = new CreatorCoinTrade(this.appData);
    this._setStateFromActivatedRoute(this.route);
    this.route.params.subscribe((params) => {
      this._setStateFromActivatedRoute(this.route);
    });
  }
}
