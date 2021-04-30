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
    "The founder reward is set by the creator. It allows the creator " +
    "to keep a certain percentage of new coins that are minted when you buy the creator's coin.";

  @Input() displayForCreatorForm: boolean = false;
  @Input() creatorCoinTrade: CreatorCoinTrade;

  TradeCreatorTableComponent = TradeCreatorTableComponent;

  constructor(public globalVars: GlobalVarsService) {}
}
