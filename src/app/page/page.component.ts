import { Component, HostListener, Input, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-page",
  templateUrl: "./page.component.html",
  styleUrls: ["./page.component.scss"],
})
export class PageComponent implements OnInit {
  @Input() hideSidebar: boolean = false;
  @Input() simpleTopBar: boolean = false;
  @Input() title: string = null;
  @Input() showPostButton = false;
  @Input() showBottomBar = true;
  @Input() inTutorial: boolean = false;
  @Input() onlyContent: boolean = false;
  mobile = false;
  environment = environment;

  @HostListener("window:resize") onResize() {
    this.setMobileBasedOnViewport();
  }

  constructor(public globalVars: GlobalVarsService) {}

  ngOnInit() {
    this.setMobileBasedOnViewport();
  }

  // send logged out users to the landing page
  // send logged in users to browse
  homeLink(): string | string[] {
    if (this.inTutorial) {
      return [];
    }
    if (this.globalVars.showLandingPage()) {
      return "/" + this.globalVars.RouteNames.LANDING;
    }
    return "/" + this.globalVars.RouteNames.BROWSE;
  }

  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }
}
