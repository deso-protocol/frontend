import { Component, Input, OnInit } from "@angular/core";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { GlobalVarsService } from "../../global-vars.service";

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
  @Input() userFollowingCreator: boolean;

  TradeCreatorTableComponent = TradeCreatorTableComponent;

  constructor(public globalVars: GlobalVarsService) {}
}
