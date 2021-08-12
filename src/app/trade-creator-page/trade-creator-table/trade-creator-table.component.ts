import { Component, Input, OnInit } from "@angular/core";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { GlobalVarsService } from "../../global-vars.service";
import { FollowService } from "../../../lib/services/follow/follow.service";

@Component({
  selector: "trade-creator-table",
  templateUrl: "./trade-creator-table.component.html",
  styleUrls: ["./trade-creator-table.component.scss"],
})
export class TradeCreatorTableComponent {
  static FOUNDER_REWARD_EXPLANATION =
    "The founder reward is set by the creator and determines what percentage of your purchase goes directly to the creator.";

  @Input() displayForCreatorForm: boolean = false;
  @Input() creatorCoinTrade: CreatorCoinTrade;

  hideFollowPrompt = true;
  TradeCreatorTableComponent = TradeCreatorTableComponent;
  appData: GlobalVarsService;

  constructor(public globalVars: GlobalVarsService, private followService: FollowService) {
    this.appData = globalVars;
  }

  // Hide follow prompt if user is already following or if user is buying own coin
  _shouldHideFollowPrompt() {
    console.log(this.creatorCoinTrade);
    this.hideFollowPrompt =
      this.followService._isLoggedInUserFollowing(this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check) ||
      this.appData.loggedInUser.PublicKeyBase58Check === this.creatorCoinTrade.creatorProfile.PublicKeyBase58Check ||
      this.creatorCoinTrade.tradeType !== CreatorCoinTrade.BUY_VERB;
  }

  ngOnInit() {
    this._shouldHideFollowPrompt();
  }
}
