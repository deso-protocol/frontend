import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BackendApiService } from "../../backend-api.service";
import { AppRoutingModule } from "../../app-routing.module";

@Component({
  selector: "messages-thread-view",
  templateUrl: "./messages-thread-view.component.html",
  styleUrls: ["./messages-thread-view.component.scss"],
})
export class MessagesThreadViewComponent {
  @Input() messageThread: any;
  @Input() isMobile = false;
  messageText = "";
  sendMessageBeingCalled = false;
  AppRoutingModule = AppRoutingModule;

  constructor(public globalVars: GlobalVarsService, private backendApi: BackendApiService) {}

  // Update the scroll when the messageContainer element is rendered.
  @ViewChild("messagesContainer") set userContent(element) {
    if (element) {
      element.nativeElement.scrollTop = element.nativeElement.scrollHeight;
    }
  }

  counterpartyUsername() {
    if (!this.messageThread || !this.messageThread.ProfileEntryResponse) {
      return null;
    }

    return this.messageThread.ProfileEntryResponse.Username;
  }

  _scrollToMostRecentMessage() {
    var element = document.getElementById("messagesContainer");
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  _resetMessageText(textVal: string) {
    // This is a hack to make sure that the enter key has been added to messageText before reset.
    setTimeout(() => {
      this.messageText = textVal;
      this._scrollToMostRecentMessage();
    }, 0);
  }

  _messageTextChanged(event) {
    if (event == null) {
      return;
    }
    // When the shift key is pressed ignore the signal.
    if (event.shiftKey) {
      return;
    }
    if (event.key === "Enter") {
      this._sendMessage();
    }
  }

  _sendMessage() {
    // If we get here then it means Enter has been pressed without the shift
    // key held down or the send message button has been pressed.
    if (this.messageText == null || this.messageText === "") {
      this.globalVars._alertError("Please enter a message to send.");
      this.messageText = "";
      this._scrollToMostRecentMessage();
      return;
    }
    if (this.sendMessageBeingCalled) {
      this.globalVars._alertError("Still processing your previous message. Please wait a few seconds.");
      return;
    }

    // Immediately add the message to the list  to make it feel instant.
    const messageObj: any = {
      SenderPublicKeyBase58Check: this.globalVars.loggedInUser.PublicKeyBase58Check,
      RecipientPublicKeyBase58Check: this.messageThread.PublicKeyBase58Check,
      DecryptedText: this.messageText,
      IsSender: true,
      TstampNanos: null, // We explicitly set this to null so we can rely on it for "sending..." text.
    };
    this.messageThread.Messages.push(messageObj);
    this._scrollToMostRecentMessage();

    // Move the thread to the top of the messageResponse object to make it feel responsive.
    for (let ii = 0; ii < this.globalVars.messageResponse.OrderedContactsWithMessages.length; ii++) {
      // Check if we've hit the contact in the list
      if (
        this.globalVars.messageResponse.OrderedContactsWithMessages[ii].PublicKeyBase58Check ===
        this.messageThread.PublicKeyBase58Check
      ) {
        // Check if this thread is already at the top
        if (ii == 0) {
          break;
        }

        // Move the threads around inside OrderedContactsWithMessages to put the current thread at the top.
        let currentContact = this.globalVars.messageResponse.OrderedContactsWithMessages[ii];
        let messagesBelow = this.globalVars.messageResponse.OrderedContactsWithMessages.slice(ii + 1);
        let messagesAbove = this.globalVars.messageResponse.OrderedContactsWithMessages.slice(0, ii);
        let newMessageList = messagesAbove.concat(messagesBelow);
        newMessageList.unshift(currentContact);
        this.globalVars.messageResponse.OrderedContactsWithMessages = newMessageList;
      }
    }

    // If we get here then we have a message to send on the current thread.
    this.sendMessageBeingCalled = true;
    this.globalVars.pauseMessageUpdates = true;
    const textToSend = this.messageText;
    this._resetMessageText("");

    this.backendApi
      .SendMessage(
        this.globalVars.localNode,
        this.globalVars.loggedInUser.PublicKeyBase58Check,
        this.messageThread.PublicKeyBase58Check,
        textToSend,
        this.globalVars.feeRateBitCloutPerKB * 1e9
      )
      .subscribe(
        (res: any) => {
          this.globalVars.logEvent("message : send");

          this.sendMessageBeingCalled = false;
          this.globalVars.messageMeta.decryptedMessgesMap[
            this.globalVars.loggedInUser.PublicKeyBase58Check + "" + res.TstampNanos
          ] = messageObj;
          this.backendApi.SetStorage(this.backendApi.MessageMetaKey, this.globalVars.messageMeta);
          // Set the timestamp in this case since it's normally set by the BE.
          messageObj.TstampNanos = res.TstampNanos;

          // Increment the notification map.
          this.globalVars.messageMeta.notificationMap[
            this.globalVars.loggedInUser.PublicKeyBase58Check + this.messageThread.PublicKeyBase58Check
          ]++;
        },
        (error) => {
          this.globalVars.logEvent("message : send : error");

          // Remove the previous message since it didn't actually post and reset
          // the text area to the old message.
          this.messageThread.Messages.pop();
          this.messageText = textToSend;

          this.sendMessageBeingCalled = false;
          this.globalVars._alertError(this.backendApi.parseMessageError(error));
          return;
        }
      )
      .add(() => {
        this.globalVars.pauseMessageUpdates = false;
      });
  }
}
