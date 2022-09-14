import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { GlobalVarsService } from '../../global-vars.service';
import {
  MessageContactResponse,
  ProfileEntryResponse,
} from '../../backend-api.service';

@Component({
  selector: 'messages-thread',
  templateUrl: './messages-thread.component.html',
  styleUrls: ['./messages-thread.component.scss'],
})
export class MessagesThreadComponent {
  @Input() thread: MessageContactResponse;
  @Input() isSelected: boolean;
  @Input() pubKeyToProfileEntryResponses: {
    [k: string]: ProfileEntryResponse;
  } = {};
  isHovered = false;

  // TODO: Fix this component to work better for DMs. Currently this
  // shows your own avatar and username for DMs.
  constructor(public globalVars: GlobalVarsService) {}

  getMostRecentMessage(): any {
    return this.thread?.Messages[this.thread?.Messages?.length - 1];
  }

  getMostRecentPubKey(): string {
    const mostRecentMessage = this.getMostRecentMessage();
    if (!mostRecentMessage) {
      return this.thread?.PublicKeyBase58Check;
    }
    // If Messaging group, use messaging group key name. Ugh,
    // Prob gonna be weird if messaging DMs with default key.
    if (this.thread.MessagingGroup?.MessagingGroupKeyName) {
      return mostRecentMessage.SenderPublicKeyBase58Check;
    }
    return mostRecentMessage.IsSender
      ? mostRecentMessage.RecipientPublicKeyBase58Check
      : mostRecentMessage.SenderPublicKeyBase58Check;
  }

  getMostRecentProfileEntryResponse(): ProfileEntryResponse | undefined {
    return (
      this.pubKeyToProfileEntryResponses[this.getMostRecentPubKey()] ||
      this.thread?.ProfileEntryResponse
    );
  }

  getMostRecentUserName(): string {
    const mostRecentPubKey = this.getMostRecentPubKey();
    const profileEntry =
      this.pubKeyToProfileEntryResponses[mostRecentPubKey] ||
      this.thread?.ProfileEntryResponse;
    return profileEntry
      ? profileEntry.Username || profileEntry.PublicKeyBase58Check
      : mostRecentPubKey;
  }
}
