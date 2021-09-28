import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BalanceEntryResponse, TutorialStatus } from "../../backend-api.service";

@Component({
  selector: "wallet-table",
  templateUrl: "./wallet-table.component.html",
})
export class WalletTableComponent {
  static PAGE_SIZE = 20;
  static BUFFER_SIZE = 10;
  static WINDOW_VIEWPORT = true;
  static PADDING = 0.5;

  @Input() inTutorial: boolean;
  @Input() tutorialStatus: TutorialStatus;
  @Input() balanceEntryToHighlight: BalanceEntryResponse;
  @Input() datasource;

  globalVars: GlobalVarsService;
  TutorialStatus = TutorialStatus;

  constructor(private appData: GlobalVarsService) {
    this.globalVars = appData;
  }

  isHighlightedCreator(balanceEntryResponse: BalanceEntryResponse): boolean {
    if (!this.inTutorial) {
      return false;
    }
    return (
      balanceEntryResponse.ProfileEntryResponse.Username.toLowerCase() === this.balanceEntryToHighlight.ProfileEntryResponse.Username.toLowerCase()
    );
  }
}
