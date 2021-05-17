import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, User } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";

@Component({
  selector: "messages-inbox",
  templateUrl: "./messages-inbox.component.html",
  styleUrls: ["./messages-inbox.component.scss"],
})
export class MessagesInboxComponent implements OnInit, OnChanges {
  static CONTACT_US_USERNAME = "clippy";

  static QUERYTOTAB = {
    "all":        "All",
    "my-holders": "My Holders",
    "custom":     "Custom",
  };
  static TABTOQUERY = {
    "All":        "all",
    "My Holders": "my-holders",
    "Custom":     "custom"
  };

  @Input() messageThreads: any;
  @Input() profileMap: any;
  @Input() isMobile = false;
  @Output() selectedThreadEmitter = new EventEmitter<any>();
  selectedThread: any;
  newMessagesFromPage: number;
  fetchingMoreMessages: boolean = false;
  activeTab: string;

  // The contact to select by default, passed in via query param. Note: if the current user
  // doesn't have a conversation with the contact, these parameters do nothing.
  defaultContactPublicKey: any;
  defaultContactUsername: any;
  contactUsername: any;
  constructor(
    private globalVars: GlobalVarsService,
    private backendApi: BackendApiService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.route.params.subscribe((params) => {
      this.contactUsername = params.username;
    });

    // Based on the route path set the tab and update filter/sort params
    this.route.queryParams.subscribe((params) => {
      this.activeTab =
        params.messagesTab && params.messagesTab in MessagesInboxComponent.QUERYTOTAB
          ? MessagesInboxComponent.QUERYTOTAB[params.messagesTab]
          : "My Holders";
      if (this.activeTab !== "My Holders") {
        this._handleTabClick(this.activeTab);
      }
    });

    // Set the filter parameters based on the tab
    this._setMessagesFilter(this.activeTab);

    // Load the initial messages for the user
    this.loadInitialMessages();
  }

  ngOnInit() {
    // If an initial message exists, we open the thread and read it.
    if (this.messageThreads && this.messageThreads.length > 0) {
      this.updateReadMessagesForSelectedThread();
    }

    this._setSelectedThreadBasedOnDefaultThread();
  }

  ngOnChanges(changes: any) {
    // If messageThreads were not loaded when the component initialized, we handle them here.
    if (changes.messageThreads.previousValue === null && changes.messageThreads.currentValue.length > 0) {
      this.updateReadMessagesForSelectedThread();
    }
  }

  showMoreButton() {
    return !(this.newMessagesFromPage != null && this.newMessagesFromPage < this.globalVars.messagesPerFetch);
  }

  loadInitialMessages() {
    if (!this.globalVars.loggedInUser) {
      return;
    }

    this.backendApi.GetMessages(
      this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check,
      "",
      this.globalVars.messagesPerFetch,
      this.globalVars.messagesRequestsHoldersOnly,
      this.globalVars.messagesRequestsHoldingsOnly,
      this.globalVars.messagesRequestsFollowersOnly,
      this.globalVars.messagesRequestsFollowedOnly,
      this.globalVars.messagesSortAlgorithm,
    ).subscribe(
      (res) => {
        if (this.globalVars.pauseMessageUpdates) {
          // We pause message updates when a user sends a messages so that we can
          // wait for it to be sent before updating the thread.  If we do not do this the
          // temporary message place holder would disappear until "GetMessages()" finds it.
        } else {
          this.globalVars.messageResponse = res;

          // Update the number of new messages so we know when to stop scrolling
          this.newMessagesFromPage = res.OrderedContactsWithMessages.length;
        }
      },
      (err) => {
        console.error(this.backendApi.stringifyError(err));
      }
    );
  }

  loadMoreMessages() {
    // If we're currently fetching messages
    if (this.fetchingMoreMessages) {
      return;
    }

    this.fetchingMoreMessages = true;
    if (!this.globalVars.loggedInUser) {
      return;
    }

    if (this.newMessagesFromPage != null && this.newMessagesFromPage == 0) {
      return
    }

    let fetchAfterPubKey = "";
    if (this.globalVars.messageResponse.OrderedContactsWithMessages) {
      fetchAfterPubKey =
        this.globalVars.messageResponse.OrderedContactsWithMessages[this.globalVars.messageResponse.OrderedContactsWithMessages.length - 1].PublicKeyBase58Check;
    }

    this.backendApi
      .GetMessages(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        fetchAfterPubKey,
        this.globalVars.messagesPerFetch,
        this.globalVars.messagesRequestsHoldersOnly,
        this.globalVars.messagesRequestsHoldingsOnly,
        this.globalVars.messagesRequestsFollowersOnly,
        this.globalVars.messagesRequestsFollowedOnly,
        this.globalVars.messagesSortAlgorithm,
      )
      .toPromise()
      .then(
        (res) => {
          if (this.globalVars.pauseMessageUpdates) {
            // We pause message updates when a user sends a messages so that we can
            // wait for it to be sent before updating the thread.  If we do not do this the
            // temporary message place holder would disappear until "GetMessages()" finds it.
          } else {
            if (!this.globalVars.messageResponse) {
              this.globalVars.messageResponse = res;

              // If globalVars already has a messageResponse, we need to consolidate.
            } else if (JSON.stringify(this.globalVars.messageResponse) !== JSON.stringify(res)) {

              // Add the new contacts
              this.globalVars.messageResponse.OrderedContactsWithMessages =
                this.globalVars.messageResponse.OrderedContactsWithMessages.concat(res.OrderedContactsWithMessages);

              // If they're a new contact, add their read/unread status mapping
              for (let key in res.UnreadStateByContact) {
                this.globalVars.messageResponse.UnreadStateByContact[key] = res.UnreadStateByContact[key];
              }

              // Update the number of unread threads
              this.globalVars.messageResponse.NumberOfUnreadThreads =
                this.globalVars.messageResponse.NumberOfUnreadThreads + res.NumberOfUnreadThreads;

              // Update the number of new messages so we know when to stop scrolling
              this.newMessagesFromPage = res.OrderedContactsWithMessages.length;
            }
          }
        },
        (err) => {
          console.error(this.backendApi.stringifyError(err));
        }
      ).finally(() => {
      this.fetchingMoreMessages = false;
      }
    );
  }

  _setMessagesFilter(tabName: any) {
    // Set the request parameters if it's a known tab.
    // Custom is set in the filter menu component and saved in local storage.
    if (tabName == "My Holders") {
      this.globalVars.messagesRequestsHoldersOnly = true;
      this.globalVars.messagesRequestsHoldingsOnly = false;
      this.globalVars.messagesRequestsFollowersOnly = false;
      this.globalVars.messagesRequestsFollowedOnly = false;
      this.globalVars.messagesSortAlgorithm = "time";
    } else if (tabName == "All") {
      this.globalVars.messagesRequestsHoldersOnly = false;
      this.globalVars.messagesRequestsHoldingsOnly = false;
      this.globalVars.messagesRequestsFollowersOnly = false;
      this.globalVars.messagesRequestsFollowedOnly = false;
      this.globalVars.messagesSortAlgorithm = "time";
    } else if (tabName == "Custom") {
      this.globalVars.messagesRequestsHoldersOnly =
        this.backendApi.GetStorage('customMessagesRequestsHoldersOnly');
      this.globalVars.messagesRequestsHoldingsOnly =
        this.backendApi.GetStorage('customMessagesRequestsHoldingsOnly');
      this.globalVars.messagesRequestsFollowersOnly =
        this.backendApi.GetStorage('customMessagesRequestsFollowersOnly');
      this.globalVars.messagesRequestsFollowedOnly =
        this.backendApi.GetStorage('customMessagesRequestsFollowedOnly');
      this.globalVars.messagesSortAlgorithm = this.backendApi.GetStorage('customMessagesSortAlgorithm');
    }
  }

  _clearMessages() {
    this.newMessagesFromPage = null;

    // If messageResponse isn't set, we return
    if (!this.globalVars.messageResponse) {
      return;
    }

    this.globalVars.messageResponse.OrderedContactsWithMessages = [];
    this.globalVars.messageResponse.UnreadStateByContact = {};
    this.globalVars.messageResponse.NumberOfUnreadThreads = 0;
  }

  _handleTabClick(tabName: any) {
    // Clear the current messages
    this._clearMessages();

    // Set the messages filters based on the tab
    this._setMessagesFilter(tabName);

    // Make sure the tab is set in the url
    this.activeTab = tabName;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { messagesTab: MessagesInboxComponent.TABTOQUERY[tabName] },
      queryParamsHandling: "merge",
    });

    // Fetch initial messages for the new tab
    this.loadInitialMessages();
  }

  _toggleSettingsTray() {
    this.globalVars.openSettingsTray = !this.globalVars.openSettingsTray;
  }

  _settingsTrayIsOpen() {
    return this.globalVars.openSettingsTray;
  }

  // This sets the thread based on the defaultContactPublicKey or defaultContactUsername URL
  // parameter
  _setSelectedThreadBasedOnDefaultThread() {
    // To figure out the default thread, we have to wait for globalVars to get a messagesResponse,
    // so we set an interval and repeat until we get it. It might be better to use
    // an explicit subscription, but this is less cruft, so not sure.
    // TODO: refactor silly setInterval
    let interval = setInterval(() => {
      // If we don't have the messageResponse yet, return
      let orderedContactsWithMessages = this.globalVars.messageResponse?.OrderedContactsWithMessages;
      if (orderedContactsWithMessages == null) {
        return;
      }

      let defaultThread = _.find(orderedContactsWithMessages, (messageContactResponse) => {
        let responseUsername = messageContactResponse.ProfileEntryResponse?.Username;
        let matchesUsername = responseUsername && responseUsername === this.contactUsername;
        let matchesPublicKey = this.contactUsername === messageContactResponse.PublicKeyBase58Check;
        return (responseUsername && matchesUsername) || matchesPublicKey;
      });

      if (!this.selectedThread) {
        this._handleMessagesThreadClick(defaultThread);
      }

      clearInterval(interval);
    }, 50);
  }

  // This marks all messages as read and relays this request to the server.
  _markAllMessagesRead() {
    for (let thread of this.messageThreads) {
      this.globalVars.messageResponse.UnreadStateByContact[thread.PublicKeyBase58Check] = false;
    }

    // Send an update back to the server noting that we want to mark all threads read.
    this.backendApi.MarkAllMessagesRead(this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check)
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
    this.globalVars.messageResponse.NumberOfUnreadThreads = 0
  }

  _getThreadWithPubKey(pubKey: string) {
    for (let thread of this.messageThreads) {
      // Public keys without a profile can message so use safe navigation
      if (thread.ProfileEntryResponse?.PublicKeyBase58Check === pubKey) {
        return thread;
      }
    }
    return false;
  }

  _handleCreatorSelectedInSearch(creator: any) {
    // If we haven't gotten the user's message state yet, bail.
    if (!this.globalVars.messageResponse) {
      return;
    }

    // If a thread with this creator already exists, select it.
    let existingThread = this._getThreadWithPubKey(creator.PublicKeyBase58Check);
    if (existingThread) {
      this._handleMessagesThreadClick(existingThread);
      return;
    }

    // Add the creator to the inbox as a new thread.
    let newThread = {
      PublicKeyBase58Check: creator.PublicKeyBase58Check,
      Messages: [],
      ProfileEntryResponse: creator,
      NumMessagesRead: 0,
    };
    // This gets appeneded to the front of the ordered contacts list in the message inbox.
    this.messageThreads.unshift(newThread);
    // Make this the new selected thread.
    this._handleMessagesThreadClick(newThread);
  }

  _handleMessagesThreadClick(thread: any) {
    this.selectedThread = thread;
    this.selectedThreadEmitter.emit(thread);
    this.updateReadMessagesForSelectedThread();
    if (thread) {
      this.router.navigate(
        [
          "/" + this.globalVars.RouteNames.INBOX_PREFIX,
          thread.ProfileEntryResponse?.Username || thread.PublicKeyBase58Check,
        ],
        { queryParamsHandling: "merge" }
      );
    }
  }

  updateReadMessagesForSelectedThread() {
    // If selectedThread is undefined, we return
    if (!this.selectedThread) {
      return;
    }

    let contactPubKey = this.messageThreads[0]?.PublicKeyBase58Check;
    if (this.selectedThread && this.selectedThread.PublicKeyBase58Check) {
      contactPubKey = this.selectedThread.PublicKeyBase58Check;
    }

    // We update the read message state on global vars before sending the request so it is more instant.
    this.globalVars.messageResponse.UnreadStateByContact[contactPubKey] = false;
    this.globalVars._setNumMessagesToRead();

    // Send an update back to the server noting that we read this thread.
    this.backendApi.MarkContactMessagesRead(this.globalVars.localNode,
      this.globalVars.loggedInUser.PublicKeyBase58Check,
      this.selectedThread.PublicKeyBase58Check)
      .subscribe(
      () => {
        this.globalVars.logEvent("user : message-read");
      },
      (err) => {
        console.log(err);
        const parsedError = this.backendApi.stringifyError(err);
        this.globalVars.logEvent("user : message-read : error", { parsedError });
        this.globalVars._alertError(parsedError);
      }
    );

    // Reflect the new read receipt in the NumberOfUnreadThreads
    this.globalVars.messageResponse.NumberOfUnreadThreads -= 1;
  }
}
