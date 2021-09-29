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
    "The founder reward is set by the creator and determines what percentage of your purchase goes directly to the creator. You can set a founder reward for yourself, too!";

  @Input() displayForCreatorForm: boolean = false;
  @Input() creatorCoinTrade: CreatorCoinTrade;
  @Input() inTutorial: boolean = false;

  hideFollowPrompt = true;
  TradeCreatorTableComponent = TradeCreatorTableComponent;
  appData: GlobalVarsService;
  buyVerb = CreatorCoinTrade.BUY_VERB;

  constructor(public globalVars: GlobalVarsService, private followService: FollowService) {
    this.appData = globalVars;
  }
}
