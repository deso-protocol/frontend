import { Component, OnInit } from "@angular/core";

@Component({
  selector: "messages-create-group-chat",
  templateUrl: "./messages-create-group-chat.component.html",
  styleUrls: ["./messages-create-group-chat.component.scss"],
})
export class MessagesCreateGroupChatComponent implements OnInit {

  startingSearchText: string;
  groupChatMembers: any = [];
  selectedThread: any;
  constructor() { }

  ngOnInit(): void {
  }

  _handleCreatorSelectedInSearch(member: any) {
    // Make sure we're not adding the same member twice.
    for (let ii = 0; ii < this.groupChatMembers.length; ii++) {
      if (this.groupChatMembers[ii].PublicKeyBase58Check === member.PublicKeyBase58Check) {
        return;
      }
    }

    this.groupChatMembers.push(member);
    console.log("creator", member);
    console.log("groupChatMembers", this.groupChatMembers);
  }

  _handleMessagesThreadClick(member: any) {
    console.log("clicked", member);
  }
}
