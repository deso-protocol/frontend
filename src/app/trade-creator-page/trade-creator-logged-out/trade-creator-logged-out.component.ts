import { Component, Input, OnInit } from "@angular/core";
import { CreatorCoinTrade } from "../../../lib/trade-creator-page/creator-coin-trade";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "trade-creator-logged-out",
  templateUrl: "./trade-creator-logged-out.component.html",
  styleUrls: ["./trade-creator-logged-out.component.scss"],
})
export class TradeCreatorLoggedOutComponent {
  @Input() creatorCoinTrade: CreatorCoinTrade;

  constructor(public globalVars: GlobalVarsService) {}
}
