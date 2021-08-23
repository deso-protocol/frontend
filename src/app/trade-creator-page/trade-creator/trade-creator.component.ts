// TODO: creator coin buys: no-balance case is kinda dumb, we should have a module telling you to buy bitclout or
// creator coin

// TODO: creator coin buys: need warning about potential slippage

// TODO: creator coin buys: may need tiptips explaining why total != amount * currentPriceElsewhereOnSite

import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, TutorialStatus } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { Observable, Subscription } from "rxjs";
import {SwalHelper} from "../../../lib/helpers/swal-helper";

@Component({
  selector: "trade-creator",
  templateUrl: "./trade-creator.component.html",
  styleUrls: ["./trade-creator.component.scss"],
})
export class TradeCreatorComponent implements OnInit {
  @Input() inTutorial: boolean = false;
  @Input() tutorialBuy: boolean;
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

  // show different header text if we're at the "Invest In Yourself" stage of the tutorial
  investInYourself: boolean = false;

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
    if (!this.inTutorial) {
      this.screenToShow = this.TRADE_CREATOR_COMPLETE_SCREEN;
    } else {
      if (this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_OTHERS_BUY) {
        this.router.navigate([
          RouteNames.TUTORIAL,
          RouteNames.WALLET,
          this.globalVars.loggedInUser?.CreatorPurchasedInTutorialUsername,
        ]);
      } else if (this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_OTHERS_SELL) {
        this.router.navigate([
          RouteNames.TUTORIAL,
          RouteNames.WALLET,
          this.globalVars.loggedInUser?.CreatorPurchasedInTutorialUsername,
        ]);
      } else if (this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_SELF) {
        this.router.navigate([RouteNames.TUTORIAL, RouteNames.WALLET, this.creatorProfile.Username]);
      }
    }
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

  _getCreatorProfile(creatorUsername): Subscription {
    let readerPubKey = "";
    if (this.globalVars.loggedInUser) {
      readerPubKey = this.globalVars.loggedInUser.PublicKeyBase58Check;
    }
    return this.backendApi.GetSingleProfile(this.globalVars.localNode, "", creatorUsername).subscribe(
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
    private backendApi: BackendApiService
  ) {
    this.appData = globalVars;
    this.router = _router;
    this.route = _route;
  }

  ngOnInit() {
    this.creatorCoinTrade = new CreatorCoinTrade(this.appData);
    if (!this.inTutorial) {
      this._setStateFromActivatedRoute(this.route);
      this.route.params.subscribe((params) => {
        this._setStateFromActivatedRoute(this.route);
      });
    } else {
      this.screenToShow = this.TRADE_CREATOR_PREVIEW_SCREEN;
      this.creatorCoinTrade.isBuyingCreatorCoin = !!this.tutorialBuy;
      this.creatorCoinTrade.tradeType = !!this.tutorialBuy ? CreatorCoinTrade.BUY_VERB : CreatorCoinTrade.SELL_VERB;
      this._getCreatorProfile(this.route.snapshot.params.username).add(() => {
        this.investInYourself =
          this.globalVars.loggedInUser?.ProfileEntryResponse?.Username ===
          this.creatorCoinTrade.creatorProfile.Username;
        if (this.creatorCoinTrade.isBuyingCreatorCoin) {
          this.setUpBuyTutorial();
        } else {
          this.setUpSellTutorial();
        }
      });
    }
  }

  setUpBuyTutorial(): void {
    let balance = this.appData.loggedInUser?.BalanceNanos;
    const jumioBitCloutNanos = this.appData.jumioBitCloutNanos > 0 ? this.appData.jumioBitCloutNanos : 1e8;
    balance = balance > jumioBitCloutNanos ? jumioBitCloutNanos : balance;
    const percentToBuy =
      this.creatorProfile.PublicKeyBase58Check === this.globalVars.loggedInUser.PublicKeyBase58Check ? 0.1 : 0.5;
    this.creatorCoinTrade.bitCloutToSell = (balance * percentToBuy) / 1e9;
    this.getBuyOrSellObservable().subscribe(
      (response) => {
        this.creatorCoinTrade.expectedCreatorCoinReturnedNanos = response.ExpectedCreatorCoinReturnedNanos || 0;
        this.creatorCoinTrade.expectedFounderRewardNanos = response.FounderRewardGeneratedNanos || 0;
      },
      (err) => {
        console.error(err);
        this.appData._alertError(this.backendApi.parseProfileError(err));
      }
    );
  }

  setUpSellTutorial(): void {
    const hodlings = this.globalVars.loggedInUser?.UsersYouHODL;
    if (!hodlings) {
      // some error and return?
      return;
    }
    const creatorCoinsPurchasedInTutorial = this.globalVars.loggedInUser?.CreatorCoinsPurchasedInTutorial;
    // Sell 5% of coins purchased in buy step.
    this.creatorCoinTrade.creatorCoinToSell = (creatorCoinsPurchasedInTutorial * 0.05) / 1e9;
    this.getBuyOrSellObservable().subscribe(
      (response) => {
        this.creatorCoinTrade.expectedBitCloutReturnedNanos = response.ExpectedBitCloutReturnedNanos || 0;
      },
      (err) => {
        console.error(err);
        this.appData._alertError(this.backendApi.parseProfileError(err));
      }
    );
  }

  getBuyOrSellObservable(): Observable<any> {
    return this.backendApi.BuyOrSellCreatorCoin(
      this.appData.localNode,
      this.appData.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
      this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check /*CreatorPublicKeyBase58Check*/,
      this.creatorCoinTrade.operationType() /*OperationType*/,
      this.creatorCoinTrade.bitCloutToSell * 1e9 /*BitCloutToSellNanos*/,
      this.creatorCoinTrade.creatorCoinToSell * 1e9 /*CreatorCoinToSellNanos*/,
      0 /*BitCloutToAddNanos*/,
      0 /*MinBitCloutExpectedNanos*/,
      0 /*MinCreatorCoinExpectedNanos*/,
      this.appData.feeRateBitCloutPerKB * 1e9 /*feeRateNanosPerKB*/,
      false
    );
  }
}
