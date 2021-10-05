import { Component, HostListener, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { FeedComponent } from "../feed/feed.component";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

@Component({
  selector: "browse-page",
  templateUrl: "./browse-page.component.html",
  styleUrls: ["./browse-page.component.sass"],
})
export class BrowsePageComponent implements OnInit {
  FeedComponent = FeedComponent;
  environment = environment;

  activeTab: string = FeedComponent.GLOBAL_TAB;
  isLeftBarMobileOpen = false;
  mobile = false;

  constructor(public globalVars: GlobalVarsService, private router: Router) {}

  setMobileBasedOnViewport() {
    this.mobile = this.globalVars.isMobile();
  }

  homeLink(): string | string[] {
    if (this.globalVars.showLandingPage()) {
      return "/" + this.globalVars.RouteNames.LANDING;
    }
    return "/" + this.globalVars.RouteNames.BROWSE;
  }

  @HostListener("window:resize")
  onResize() {
    this.setMobileBasedOnViewport();
  }

  ngOnInit() {
    this.setMobileBasedOnViewport();
  }
}
