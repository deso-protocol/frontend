import { Component, OnInit } from '@angular/core';
import {GlobalVarsService} from "../../../global-vars.service";

@Component({
  selector: 'app-messages-filter-menu',
  templateUrl: './messages-filter-menu.component.html',
  styleUrls: ['./messages-filter-menu.component.scss']
})
export class MessagesFilterMenuComponent implements OnInit {

  constructor(
    private globalVars: GlobalVarsService
  ) { }

  ngOnInit(): void {
  }

  updateGlobalMessagesPreferences() {
    debugger;
    this.globalVars.openSettingsTray = !this.globalVars.openSettingsTray;
  }
}
