import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-messages-page",
  templateUrl: "./messages-page.component.html",
  styleUrls: ["./messages-page.component.scss"],
})
export class MessagesPageComponent {
  lastContactFetched = null;
  intervalsSet = [];
  selectedThread: any;
  selectedThreadDisplayName = "";
  selectedThreadProfilePic = "";
  showThreadView = false;

  constructor(public globalVars: GlobalVarsService) {}

  _handleMessageThreadSelectedMobile(thread: any) {
    if (!thread) {
      return;
    }
    this.selectedThread = thread;
    this.selectedThreadProfilePic = "/assets/img/default_profile_pic.png";
    if (thread.ProfileEntryResponse && thread.ProfileEntryResponse.ProfilePic) {
      this.selectedThreadProfilePic = thread.ProfileEntryResponse.ProfilePic;
    }
    this.selectedThreadDisplayName = thread.PublicKeyBase58Check;
    if (thread.ProfileEntryResponse && thread.ProfileEntryResponse.Username) {
      this.selectedThreadDisplayName = thread.ProfileEntryResponse.Username;
    }
    this.showThreadView = true;
  }
}
