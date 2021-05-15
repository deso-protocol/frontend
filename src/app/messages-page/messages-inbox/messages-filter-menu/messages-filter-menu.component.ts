import { Component, OnInit } from '@angular/core';
import {GlobalVarsService} from "../../../global-vars.service";
import {MessagesInboxComponent} from "../messages-inbox.component";

@Component({
  selector: 'app-messages-filter-menu',
  templateUrl: './messages-filter-menu.component.html',
  styleUrls: ['./messages-filter-menu.component.scss']
})
export class MessagesFilterMenuComponent implements OnInit {

  constructor(
    private globalVars: GlobalVarsService,
    private messagesInbox: MessagesInboxComponent,
  ) { }

  public messageFilterFollowingMe = false;
  public messageFilterIFollow = false;
  public messageFilterHoldsMe = false;
  public messageFilterIHold = false;

  ngOnInit(): void {
  }

  updateGlobalMessagesPreferences() {
    this.messagesInbox._toggleSettingsTray(); // Close the settings tray
  }

  setSortAlgorithm(s: string) {
    this.globalVars.messagesSortAlgorithm = s;
  }

  sortAlgorithmToText() {
    if (this.globalVars.messagesSortAlgorithm == 'time') {
      return 'Most recent';
    } else if (this.globalVars.messagesSortAlgorithm == 'followers') {
      return 'Most followed';
    } else {
      return 'Most clout';
    }
  }
}
