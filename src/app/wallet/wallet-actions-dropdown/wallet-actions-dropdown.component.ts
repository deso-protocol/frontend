import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { GlobalVarsService } from "../../global-vars.service";
import { TutorialStatus } from "../../backend-api.service";
import { TradeCreatorComponent } from "../../trade-creator-page/trade-creator/trade-creator.component";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "wallet-actions-dropdown",
  templateUrl: "./wallet-actions-dropdown.component.html",
})
export class WalletActionsDropdownComponent implements OnInit {
  @Input() hodlingUsername: string;
  @Input() inTutorial: boolean = false;
  @Input() isHighlightedCreator: boolean = false;
  @Output() isSelling = new EventEmitter<any>();
  AppRoutingModule = AppRoutingModule;
  showIcons = false;

  showSellOnly: boolean = false;
  RouteNames = RouteNames;
  iconHideTimeout: NodeJS.Timer;
  buyTradeType = this.globalVars.RouteNames.BUY_CREATOR;
  sellTradeType = this.globalVars.RouteNames.SELL_CREATOR;

  constructor(public globalVars: GlobalVarsService, private modalService: BsModalService) {}

  hideIcons(): void {
    this.iconHideTimeout = setTimeout(() => {
      // this.showIcons = false;
    }, 1000);
  }

  stopIconHide() {
    clearTimeout(this.iconHideTimeout);
  }

  openBuyCreatorCoinModal(event, tradeType: string) {
    event.stopPropagation();
    this.isSelling.emit();
    const initialState = { username: this.hodlingUsername, tradeType, inTutorial: this.inTutorial };
    this.modalService.show(TradeCreatorComponent, {
      class: "modal-dialog-centered buy-clout-modal",
      initialState,
    });
    this.showIcons = false;
  }

  ngOnInit(): void {
    if (this.inTutorial && this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_OTHERS_BUY) {
      this.showSellOnly = true;
    }
  }
}
