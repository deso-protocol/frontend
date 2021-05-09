import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService, User } from "../../backend-api.service";
import { ActivatedRoute, Router } from "@angular/router";
import * as _ from "lodash";
import { Location } from "@angular/common";

@Component({
  selector: "messages-inbox",
  templateUrl: "./messages-inbox.component.html",
  styleUrls: ["./messages-inbox.component.scss"],
})
export class MessagesInboxComponent implements OnInit, OnChanges {
  static CONTACT_US_USERNAME = "clippy";

  @Input() messageThreads: any;
  @Input() profileMap: any;
  @Input() isMobile = false;
  @Output() selectedThreadEmitter = new EventEmitter<any>();
  selectedThread: any;

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
    private location: Location
  ) {
    this.route.params.subscribe((params) => {
      this.contactUsername = params.username;
    });
  }

  ngOnInit() {
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
    const messageReadStateUpdatesByContact = {};
    let contactPubKey = this.messageThreads[0]?.PublicKeyBase58Check;
    if (this.selectedThread && this.selectedThread.PublicKeyBase58Check) {
      contactPubKey = this.selectedThread.PublicKeyBase58Check;
    }
    const totalReadMessages = this.globalVars.messageResponse.TotalMessagesByContact?.[contactPubKey] || 0;
    messageReadStateUpdatesByContact[contactPubKey] = totalReadMessages;

    // We update the read message state on global vars before sending the request so it is more instant.
    this.globalVars.messageResponse.MessageReadStateByContact[contactPubKey] = totalReadMessages;
    this.globalVars._setNumMessagesToRead();

    this.backendApi
      .UpdateUserGlobalMetadata(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check /*UpdaterPublicKeyBase58Check*/,
        "" /*EmailAddress*/,
        messageReadStateUpdatesByContact
      )
      .subscribe(
        (res) => {},
        (err) => {
          console.log(err);
        }
      );
  }
}
