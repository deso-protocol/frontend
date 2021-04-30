import { Component, Input, OnInit } from "@angular/core";
import { NavigationService } from "../../../lib/services/navigation-service";

@Component({
  selector: "bottom-bar-mobile-tab",
  templateUrl: "./bottom-bar-mobile-tab.component.html",
  styleUrls: ["./bottom-bar-mobile-tab.component.scss"],
})
export class BottomBarMobileTabComponent {
  @Input() link: string;

  constructor(private navigationService: NavigationService) {}

  clearNavigationHistory() {
    this.navigationService.clearHistoryAfterNavigatingToNewUrl();
  }
}
