import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AppRoutingModule, RouteNames } from "../../app-routing.module";
import { GlobalVarsService } from "../../global-vars.service";
import { ProfileEntryResponse, TutorialStatus } from "../../backend-api.service";
import { TradeCreatorComponent } from "../../trade-creator-page/trade-creator/trade-creator.component";
import { BsModalService } from "ngx-bootstrap/modal";
import { TransferDeSoComponent } from "../../transfer-deso/transfer-deso.component";

@Component({
  selector: "wallet-actions-dropdown",
  templateUrl: "./wallet-actions-dropdown.component.html",
})
export class WalletActionsDropdownComponent implements OnInit {
  @Input() hodlingUser: ProfileEntryResponse;
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
    this.showIcons = false;
  }

  stopIconHide() {
    clearTimeout(this.iconHideTimeout);
  }

  openBuyCreatorCoinModal(event, tradeType: string) {
    event.stopPropagation();
    this.isSelling.emit();
    const initialState = { username: this.hodlingUser.Username, tradeType, inTutorial: this.inTutorial };
    this.modalService.show(TradeCreatorComponent, {
      class: "modal-dialog-centered buy-deso-modal",
      initialState,
    });
    this.showIcons = false;
  }

  openSendCloutModal(event) {
    event.stopPropagation();
    const initialState = { creatorToPayInput: this.hodlingUser };
    this.modalService.show(TransferDeSoComponent, {
      class: "modal-dialog-centered buy-deso-modal",
      initialState,
    });
  }

  ngOnInit(): void {
    if (this.inTutorial && this.globalVars.loggedInUser.TutorialStatus === TutorialStatus.INVEST_OTHERS_BUY) {
      this.showSellOnly = true;
    }
  }
}
