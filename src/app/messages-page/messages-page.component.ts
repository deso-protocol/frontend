import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { AppRoutingModule } from "../app-routing.module";
import { Datasource, IDatasource } from "ngx-ui-scroll";
import { BackendApiService } from "../backend-api.service";
import { Router } from "@angular/router";
import { Title } from "@angular/platform-browser";

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
  selectedThreadPublicKey = "";
  selectedThreadProfilePic = "";
  showThreadView = false;
  AppRoutingModule = AppRoutingModule;

  constructor(
    public globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private router: Router,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.titleService.setTitle("Messages - BitClout");
  }

  _handleMessageThreadSelectedMobile(thread: any) {
    if (!thread) {
      return;
    }
    this.selectedThread = thread;
    this.selectedThreadPublicKey = thread.PublicKeyBase58Check;
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

  _toggleSettingsTray() {
    this.globalVars.openSettingsTray = !this.globalVars.openSettingsTray;
  }

  _settingsTrayBeOpen() {
    return this.globalVars.openSettingsTray;
  }

  // This marks all messages as read and relays this request to the server.
  _markAllMessagesReadMobile() {
    for (let thread of this.globalVars.messageResponse.OrderedContactsWithMessages) {
      this.globalVars.messageResponse.UnreadStateByContact[thread.PublicKeyBase58Check] = false;
    }

    // Send an update back to the server noting that we want to mark all threads read.
    this.backendApi
      .MarkAllMessagesRead(this.globalVars.localNode, this.globalVars.loggedInUser.PublicKeyBase58Check)
      .subscribe(
        () => {
          this.globalVars.logEvent("user : all-message-read");
        },
        (err) => {
          console.log(err);
          const parsedError = this.backendApi.stringifyError(err);
          this.globalVars.logEvent("user : all-message-read : error", { parsedError });
          this.globalVars._alertError(parsedError);
        }
      );

    // Reflect this change in NumberOfUnreadThreads.
    this.globalVars.messageResponse.NumberOfUnreadThreads = 0;
  }

  navigateToInbox() {
    this.selectedThread = null;
    this.selectedThreadPublicKey = "";
    this.showThreadView = false;
    this.router.navigate([], { queryParams: { username: null }, queryParamsHandling: "merge" });
  }
}
