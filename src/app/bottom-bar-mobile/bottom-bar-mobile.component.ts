import { Component, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { FeedComponent } from "../feed/feed.component";

@Component({
  selector: "bottom-bar-mobile",
  templateUrl: "./bottom-bar-mobile.component.html",
  styleUrls: ["./bottom-bar-mobile.component.scss"],
})
export class BottomBarMobileComponent {
  @Input() showPostButton = false;
  showcaseTab = FeedComponent.SHOWCASE_TAB;
  globalTab = FeedComponent.GLOBAL_TAB;
  constructor(public globalVars: GlobalVarsService) {}
}
