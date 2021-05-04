import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "left-bar-button",
  templateUrl: "./left-bar-button.component.html",
  styleUrls: ["./left-bar-button.component.scss"],
})
export class LeftBarButtonComponent {
  @Input() link: string;
  @Input() buttonLabel: string;
  @Input() hasNotifications = false;
  @Input() isUnread = false;
  notificationCount = 1;

  constructor(public globalVars: GlobalVarsService) {}

  _queryParamsForLink(link: string) {
    if(link.includes(this.globalVars.RouteNames.BROWSE)) {
      return { stepNum: null, adminTab: null } 
    } else {
      return { stepNum: null, adminTab: null, feedTab: null }
    }
  }
}
