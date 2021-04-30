import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "messages-thread",
  templateUrl: "./messages-thread.component.html",
  styleUrls: ["./messages-thread.component.scss"],
})
export class MessagesThreadComponent {
  @Input() thread: any;
  @Input() isSelected: boolean;
  isHovered = false;

  constructor(public globalVars: GlobalVarsService) {}
}
