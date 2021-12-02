import { Component, OnInit, Input } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";
import { Router } from "@angular/router";
import { ProfileEntryResponse } from "../backend-api.service";

@Component({
  selector: "simple-profile-card",
  templateUrl: "./simple-profile-card.component.html",
})
export class SimpleProfileCardComponent implements OnInit {
  @Input() profile: ProfileEntryResponse;
  @Input() diamondLevel = -1;
  @Input() showHeartIcon = false;
  @Input() showRepostIcon = false;
  @Input() containerModalRef: any = null;
  @Input() singleColumn = false;
  @Input() hideFollowLink = false;
  @Input() isBold = true;
  @Input() inTutorial: boolean = false;
  @Input() showTutorialBuy: boolean = false;

  constructor(public globalVars: GlobalVarsService, private router: Router) {}

  ngOnInit(): void {}

  counter(num: number) {
    return Array(num);
  }

  onClick() {
    if (this.inTutorial) {
      return;
    }
    if (this.containerModalRef !== null) {
      this.containerModalRef.hide();
    }
    if (!this.profile.Username) {
      return;
    }
    this.router.navigate(["/" + this.globalVars.RouteNames.USER_PREFIX, this.profile.Username], {
      queryParamsHandling: "merge",
    });
  }

  onBuyClicked() {
    this.globalVars.logEvent("buy : creator : select");
    this.router.navigate(
      [
        this.globalVars.RouteNames.TUTORIAL,
        this.globalVars.RouteNames.INVEST,
        this.globalVars.RouteNames.BUY_CREATOR,
        this.profile.Username,
      ],
      { queryParamsHandling: "merge" }
    );
  }
}
