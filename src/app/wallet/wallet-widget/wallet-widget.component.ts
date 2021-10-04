import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "wallet-widget",
  templateUrl: "./wallet-widget.component.html",
})
export class WalletWidgetComponent {
  constructor(public globalVars: GlobalVarsService) {}
  totalUSDLocked() {
    return this.globalVars.abbreviateNumber(
      this.globalVars.nanosToUSDNumber(
        this.globalVars?.loggedInUser?.ProfileEntryResponse?.CoinEntry.DeSoLockedNanos
      ),
      3,
      true
    );
  }
  coinsInCirculation() {
    return this.globalVars?.loggedInUser?.ProfileEntryResponse.CoinEntry.CoinsInCirculationNanos / 1e9;
  }
  usdMarketCap() {
    return this.globalVars.abbreviateNumber(
      this.globalVars.nanosToUSDNumber(
        this.coinsInCirculation() * this.globalVars?.loggedInUser?.ProfileEntryResponse.CoinPriceDeSoNanos
      ),
      3,
      true
    );
  }
}
