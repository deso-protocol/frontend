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
  @Input() showRecloutIcon = false;
  @Input() containerModalRef: any = null;
  @Input() singleColumn = false;

  constructor(public globalVars: GlobalVarsService, private router: Router) {}

  ngOnInit(): void {}

  counter(num: number) {
    return Array(num);
  }

  onClick() {
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
}
