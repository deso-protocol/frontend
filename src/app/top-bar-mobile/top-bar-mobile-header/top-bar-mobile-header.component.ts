import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "top-bar-mobile-header",
  templateUrl: "./top-bar-mobile-header.component.html",
  styleUrls: ["./top-bar-mobile-header.component.scss"],
})
export class TopBarMobileHeaderComponent {
  isSearching = false;
  constructor(public globalVars: GlobalVarsService) {}
}
