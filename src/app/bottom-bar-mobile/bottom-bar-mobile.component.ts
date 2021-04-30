import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "bottom-bar-mobile",
  templateUrl: "./bottom-bar-mobile.component.html",
  styleUrls: ["./bottom-bar-mobile.component.scss"],
})
export class BottomBarMobileComponent {
  @Input() showPostButton = false;

  constructor(public globalVars: GlobalVarsService) {}
}
