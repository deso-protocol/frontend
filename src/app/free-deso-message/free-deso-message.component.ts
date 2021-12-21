import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "free-deso-message",
  templateUrl: "./free-deso-message.component.html",
})
export class FreeDesoMessageComponent {
  @Input() hideMessage: boolean = false;

  constructor(public globalVars: GlobalVarsService) {}
}
