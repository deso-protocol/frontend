import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "create-profile-tutorial-page",
  templateUrl: "./create-profile-tutorial-page.component.html",
  styleUrls: ["./create-profile-tutorial-page.component.scss"],
})
export class CreateProfileTutorialPageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
