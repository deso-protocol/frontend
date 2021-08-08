import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "jumio-status",
  templateUrl: "./jumio-status.component.html",
  styleUrls: ["./jumio-status.component.scss"],
})
export class JumioStatusComponent {
  constructor(public globalVars: GlobalVarsService) {}

  openJumio(): void {
    this.globalVars.logEvent("jumio : click");
    let errorURL = new URL(window.location.href);
    errorURL.searchParams.append("jumioError", "true");
    this.globalVars.openJumio(encodeURI(window.location.href), encodeURI(errorURL.href));
  }
}
