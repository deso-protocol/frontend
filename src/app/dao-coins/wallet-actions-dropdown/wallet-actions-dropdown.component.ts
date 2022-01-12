import { Component, Input, OnInit } from "@angular/core";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { GlobalVarsService } from "../../global-vars.service";
import { TutorialStatus } from "../../backend-api.service";

@Component({
  selector: "wallet-actions-dropdown",
  templateUrl: "./wallet-actions-dropdown.component.html",
})
export class WalletActionsDropdownComponent implements OnInit {
  @Input() hodlingUsername: string;
  @Input() inTutorial: boolean = false;
  @Input() isHighlightedCreator: boolean = false;
  AppRoutingModule = AppRoutingModule;

  showSellOnly: boolean = false;
  RouteNames = RouteNames;
  constructor(public globalVars: GlobalVarsService) {}

  ngOnInit(): void {
    if (this.inTutorial && this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_OTHERS_BUY) {
      this.showSellOnly = true;
    }
  }
}
