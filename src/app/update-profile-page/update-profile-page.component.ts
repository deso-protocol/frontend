import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "app-update-profile-page",
  templateUrl: "./update-profile-page.component.html",
  styleUrls: ["./update-profile-page.component.scss"],
})
export class UpdateProfilePageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
