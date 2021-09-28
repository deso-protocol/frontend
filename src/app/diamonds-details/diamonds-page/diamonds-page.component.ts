import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "diamonds-page",
  templateUrl: "./diamonds-page.component.html",
})
export class DiamondsPageComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService) {}
}
