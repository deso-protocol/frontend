import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";
import { MessagesInboxComponent } from "../messages-inbox.component";
import { BackendApiService } from "../../../backend-api.service";

@Component({
  selector: "messages-filter-menu",
  templateUrl: "./messages-filter-menu.component.html",
})
export class MessagesFilterMenuComponent implements OnInit {
  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private messagesInbox: MessagesInboxComponent
  ) {}

  public messageFilterFollowingMe = this.backendApi.GetStorage("customMessagesRequestsFollowersOnly");
  public messageFilterIFollow = this.backendApi.GetStorage("customMessagesRequestsFollowedOnly");
  public messageFilterHoldsMe = this.backendApi.GetStorage("customMessagesRequestsHoldersOnly");
  public messageFilterIHold = this.backendApi.GetStorage("customMessagesRequestsHoldingsOnly");
  public messageSortAlgorithm =
    this.backendApi.GetStorage("customMessagesSortAlgorithm") != null
      ? this.backendApi.GetStorage("customMessagesSortAlgorithm")
      : "time";

  ngOnInit(): void {}

  updateGlobalMessagesPreferences() {
    this.messagesInbox._toggleSettingsTray(); // Close the settings tray

    // Set message request booleans
    if (this.messageFilterHoldsMe) {
      this.backendApi.SetStorage("customMessagesRequestsHoldersOnly", true);
    } else {
      this.backendApi.SetStorage("customMessagesRequestsHoldersOnly", false);
    }
    if (this.messageFilterIHold) {
      this.backendApi.SetStorage("customMessagesRequestsHoldingsOnly", true);
    } else {
      this.backendApi.SetStorage("customMessagesRequestsHoldingsOnly", false);
    }
    if (this.messageFilterFollowingMe) {
      this.backendApi.SetStorage("customMessagesRequestsFollowersOnly", true);
    } else {
      this.backendApi.SetStorage("customMessagesRequestsFollowersOnly", false);
    }
    if (this.messageFilterIFollow) {
      this.backendApi.SetStorage("customMessagesRequestsFollowedOnly", true);
    } else {
      this.backendApi.SetStorage("customMessagesRequestsFollowedOnly", false);
    }

    // Set message request algorithm
    this.backendApi.SetStorage("customMessagesSortAlgorithm", this.messageSortAlgorithm);

    // Switch to the custom tab + load the custom messages
    this.messagesInbox._handleTabClick("Custom");
  }

  setSortAlgorithm(s: string) {
    this.messageSortAlgorithm = s;
  }

  sortAlgorithmToText() {
    if (this.messageSortAlgorithm === "time") {
      return "Most recent";
    } else if (this.messageSortAlgorithm === "followers") {
      return "Most followed";
    } else if (this.messageSortAlgorithm === "holders") {
      return "Largest Holders";
    } else {
      return "Most clout";
    }
  }
}
