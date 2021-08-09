import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "jumio-status",
  templateUrl: "./jumio-status.component.html",
  styleUrls: ["./jumio-status.component.scss"],
})
export class JumioStatusComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
