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

  ngOnInit(): void {
  }

  updateGlobalMessagesPreferences() {
    this.messagesInbox._toggleSettingsTray(); // Close the settings tray

    this.globalVars.messagesSortAlgorithm = 'followers'; // Set globalVars message sort algorithm
  }

  sortAlgorithmToText() {
    if (this.globalVars.messagesSortAlgorithm == 'time') {
      return 'Most Recent First';
    } else if (this.globalVars.messagesSortAlgorithm == 'followers') {
      return 'Most Followed First';
    } else {
      return 'Most BitClout Locked First';
    }
  }
}
