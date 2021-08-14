import {Component, Input, OnInit} from "@angular/core";
import {GlobalVarsService} from "../global-vars.service";
import {AppRoutingModule, RouteNames} from "../app-routing.module";
import {BackendApiService, BalanceEntryResponse, TutorialStatus} from "../backend-api.service";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: "wallet",
  templateUrl: "./wallet.component.html",
})
export class WalletComponent implements OnInit {
  @Input() inTutorial: boolean;

  globalVars: GlobalVarsService;
  AppRoutingModule = AppRoutingModule;
  hasUnminedCreatorCoins: boolean;
  showTransferredCoins: boolean = false;

  sortedUSDValueFromHighToLow: number = 0;
  sortedPriceFromHighToLow: number = 0;
  sortedUsernameFromHighToLow: number = 0;

  usersYouReceived: BalanceEntryResponse[] = [];
  usersYouPurchased: BalanceEntryResponse[] = [];

  static coinsPurchasedTab: string = "Coins Purchased";
  static coinsReceivedTab: string = "Coins Received";
  tabs = [WalletComponent.coinsPurchasedTab, WalletComponent.coinsReceivedTab];
  activeTab: string = WalletComponent.coinsPurchasedTab;
  tutorialUsername: string;

  constructor(
    private appData: GlobalVarsService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.globalVars = appData;
    this.route.params.subscribe((params) => {
      if (params.username) {
        this.tutorialUsername = params.username;
      }
    });
  }

  ngOnInit() {
    this.globalVars.loggedInUser.UsersYouHODL.map((balanceEntryResponse: BalanceEntryResponse) => {
      if (balanceEntryResponse.NetBalanceInMempool != 0) {
        this.hasUnminedCreatorCoins = true;
      }
      // If you purchased the coin or the balance entry response if for your creator coin, show it in the purchased tab.
      if (
        balanceEntryResponse.HasPurchased ||
        balanceEntryResponse.HODLerPublicKeyBase58Check === balanceEntryResponse.CreatorPublicKeyBase58Check
      ) {
        this.usersYouPurchased.push(balanceEntryResponse);
      } else {
        this.usersYouReceived.push(balanceEntryResponse);
      }
    });
    this.sortWallet("value");
    this.titleService.setTitle("Wallet - BitClout");
  }

  // sort by USD value
  sortHodlingsCoins(hodlings: BalanceEntryResponse[], descending: boolean): void {
    this.sortedUsernameFromHighToLow = 0;
    this.sortedPriceFromHighToLow = 0;
    this.sortedUSDValueFromHighToLow = descending ? -1 : 1;
    hodlings.sort((a: BalanceEntryResponse, b: BalanceEntryResponse) => {
      return (
        this.sortedUSDValueFromHighToLow *
        (this.globalVars.bitcloutNanosYouWouldGetIfYouSold(a.BalanceNanos, a.ProfileEntryResponse.CoinEntry) -
          this.globalVars.bitcloutNanosYouWouldGetIfYouSold(b.BalanceNanos, b.ProfileEntryResponse.CoinEntry))
      );
    });
  }

  // sort by coin price
  sortHodlingsPrice(hodlings: BalanceEntryResponse[], descending: boolean): void {
    this.sortedUsernameFromHighToLow = 0;
    this.sortedPriceFromHighToLow = descending ? -1 : 1;
    this.sortedUSDValueFromHighToLow = 0;
    hodlings.sort((a: BalanceEntryResponse, b: BalanceEntryResponse) => {
      return (
        this.sortedPriceFromHighToLow *
        (this.globalVars.bitcloutNanosYouWouldGetIfYouSold(
          a.ProfileEntryResponse.CoinPriceBitCloutNanos,
          a.ProfileEntryResponse.CoinEntry
        ) -
          this.globalVars.bitcloutNanosYouWouldGetIfYouSold(
            b.ProfileEntryResponse.CoinPriceBitCloutNanos,
            b.ProfileEntryResponse.CoinEntry
          ))
      );
    });
  }

  // sort by username
  sortHodlingsUsername(hodlings: BalanceEntryResponse[], descending: boolean): void {
    this.sortedUsernameFromHighToLow = descending ? -1 : 1;
    this.sortedPriceFromHighToLow = 0;
    this.sortedUSDValueFromHighToLow = 0;
    hodlings.sort((a: BalanceEntryResponse, b: BalanceEntryResponse) => {
      return (
        this.sortedUsernameFromHighToLow *
        b.ProfileEntryResponse.Username.localeCompare(a.ProfileEntryResponse.Username)
      );
    });
  }

  sortWallet(column: string) {
    let descending: boolean;
    switch (column) {
      case "username":
        // code block
        descending = this.sortedUsernameFromHighToLow === -1 ? false : true;
        this.sortHodlingsUsername(this.usersYouPurchased, descending);
        this.sortHodlingsUsername(this.usersYouReceived, descending);
        break;
      case "price":
        descending = this.sortedPriceFromHighToLow === -1 ? false : true;
        this.sortHodlingsPrice(this.usersYouPurchased, descending);
        this.sortHodlingsPrice(this.usersYouReceived, descending);
        break;
      case "value":
        descending = this.sortedUSDValueFromHighToLow === -1 ? false : true;
        this.sortHodlingsCoins(this.usersYouPurchased, descending);
        this.sortHodlingsCoins(this.usersYouReceived, descending);
        break;
      default:
      // do nothing
    }
  }

  totalValue() {
    let result = 0;

    for (const holding of this.globalVars.loggedInUser.UsersYouHODL) {
      result +=
        this.globalVars.bitcloutNanosYouWouldGetIfYouSold(
          holding.BalanceNanos,
          holding.ProfileEntryResponse.CoinEntry
        ) || 0;
    }

    return result;
  }

  unminedBitCloutToolTip() {
    return (
      "Mining in progress. Feel free to transact in the meantime.\n\n" +
      "Mined balance:\n" +
      this.globalVars.nanosToBitClout(this.globalVars.loggedInUser.BalanceNanos, 9) +
      " BitClout.\n\n" +
      "Unmined balance:\n" +
      this.globalVars.nanosToBitClout(this.globalVars.loggedInUser.UnminedBalanceNanos, 9) +
      " BitClout."
    );
  }

  unminedCreatorCoinToolTip(creator: any) {
    return (
      "Mining in progress. Feel free to transact in the meantime.\n\n" +
      "Net unmined transactions:\n" +
      this.globalVars.nanosToBitClout(creator.NetBalanceInMempool, 9) +
      " BitClout.\n\n" +
      "Balance w/unmined transactions:\n" +
      this.globalVars.nanosToBitClout(creator.BalanceNanos, 9) +
      " BitClout.\n\n"
    );
  }

  usernameTruncationLength(): number {
    return this.globalVars.isMobile() ? 14 : 20;
  }

  emptyHodlerListMessage(): string {
    return this.showTransferredCoins
      ? "You haven't received coins from any creators you don't already hold."
      : "You haven't purchased any creator coins yet.";
  }

  _handleTabClick(tab: string) {
    this.showTransferredCoins = tab === WalletComponent.coinsReceivedTab;
    this.activeTab = tab;
  }

  tutorialNext(): void {
    // How do we want to differentiate between stages in tutorial? look at user metadata
    const tutorialStatus = this.globalVars.loggedInUser?.TutorialStatus;
    console.log(tutorialStatus);
    if (tutorialStatus === TutorialStatus.INVEST_OTHERS_BUY) {
      this.router.navigate([RouteNames.TUTORIAL, RouteNames.INVEST, RouteNames.SELL_CREATOR, this.tutorialUsername]);
    } else if (tutorialStatus === TutorialStatus.INVEST_OTHERS_SELL) {
      // TODO: go to diamonds first
      this.router.navigate([RouteNames.TUTORIAL, RouteNames.DIAMONDS]);
    } else if (tutorialStatus === TutorialStatus.INVEST_SELF) {
      // this.globalVars.TutorialStatus = TutorialStatus.COMPLETE;
      this.backendApi
        .CompleteTutorial(this.globalVars.localNode, this.globalVars.loggedInUser?.PublicKeyBase58Check)
        .subscribe(() => {
          // We don't really need an update everything call here. Next time they refresh the page, the status should be correct.
          this.globalVars.loggedInUser.TutorialStatus = TutorialStatus.COMPLETE;
          this.router.navigate([RouteNames.BROWSE]);
        });
    }
  }
}
