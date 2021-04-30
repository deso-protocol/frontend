import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "right-bar-creators",
  templateUrl: "./right-bar-creators.component.html",
  styleUrls: ["./right-bar-creators.component.sass"],
})
export class RightBarCreatorsComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
