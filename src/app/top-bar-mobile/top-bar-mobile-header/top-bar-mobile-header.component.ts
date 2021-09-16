import {Component, Input, OnInit} from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import {Location} from "@angular/common";

@Component({
  selector: "top-bar-mobile-header",
  templateUrl: "./top-bar-mobile-header.component.html",
  styleUrls: ["./top-bar-mobile-header.component.scss"],
})
export class TopBarMobileHeaderComponent {
  // Certain pages only have a back button and a title for the top bar.
  @Input() simpleTopBar: boolean = false;
  @Input() title: string = null;
  isSearching = false;
  constructor(public globalVars: GlobalVarsService, private location: Location) {}
}
