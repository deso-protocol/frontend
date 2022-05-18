import { Component } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "dao-coins-page",
  templateUrl: "./dao-coins-page.component.html",
  styleUrls: ["./dao-coins-page.component.scss"],
})
export class DaoCoinsPageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
