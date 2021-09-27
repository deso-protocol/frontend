import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "reclouts-page",
  templateUrl: "./reclouts-page.component.html",
})
export class RecloutsPageComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService) {}
}
