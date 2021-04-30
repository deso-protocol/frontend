import { Component, OnInit } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-admin-page",
  templateUrl: "./admin-page.component.html",
  styleUrls: ["./admin-page.component.scss"],
})
export class AdminPageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
