import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-pick-a-coin-page",
  templateUrl: "./pick-a-coin-page.component.html",
})
export class PickACoinPageComponent implements OnInit {
  globalVars: GlobalVarsService;
  AppRoutingModule = AppRoutingModule;
  hasUnminedCreatorCoins: boolean;

  constructor(private appData: GlobalVarsService, private titleService: Title) {
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

  // Set Title function for dynamically setting the title
  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle);
  }
}
