import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";

@Component({
  selector: "wallet",
  templateUrl: "./wallet.component.html",
})
export class WalletComponent implements OnInit {
  globalVars: GlobalVarsService;
  AppRoutingModule = AppRoutingModule;
  hasUnminedCreatorCoins: boolean;

  constructor(private appData: GlobalVarsService) {
    this.globalVars = appData;
  }

  ngOnInit() {
    for (let creator of this.usersYouHODL()) {
      if (creator.NetBalanceInMempool != 0) {
        this.hasUnminedCreatorCoins = true;
      }
    }
  }

  usersYouHODL() {
    const creators = this.globalVars.loggedInUser.UsersYouHODL;
    creators.sort((a, b) => {
      return (
        this.globalVars.bitcloutNanosYouWouldGetIfYouSold(b.BalanceNanos, b.ProfileEntryResponse.CoinEntry) -
        this.globalVars.bitcloutNanosYouWouldGetIfYouSold(a.BalanceNanos, a.ProfileEntryResponse.CoinEntry)
      );
    });
    return creators;
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
}
