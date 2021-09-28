import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "reposts-page",
  templateUrl: "./reposts-page.component.html",
})
export class RepostsPageComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService) {}
}
