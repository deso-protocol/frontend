import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "top-bar-mobile-log-in-or-sign-up",
  templateUrl: "./top-bar-mobile-log-in-or-sign-up.component.html",
  styleUrls: ["./top-bar-mobile-log-in-or-sign-up.component.scss"],
})
export class TopBarMobileLogInOrSignUpComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
