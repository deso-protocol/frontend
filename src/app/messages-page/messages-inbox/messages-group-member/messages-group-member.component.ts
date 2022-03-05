import {Component, Input, OnInit} from "@angular/core";
import { GlobalVarsService } from "../../../global-vars.service";

@Component({
  selector: "messages-group-member",
  templateUrl: "./messages-group-member.component.html",
  styleUrls: ["./messages-group-member.component.scss"],
})
export class MessagesGroupMemberComponent {
  @Input() member: any;
  @Input() isSelected: boolean;
  isHovered = false;

  constructor(public globalVars: GlobalVarsService) {}
}
