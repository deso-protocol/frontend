import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "right-bar-signup",
  templateUrl: "./right-bar-signup.component.html",
  styleUrls: ["./right-bar-signup.component.scss"],
})
export class RightBarSignupComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
