import { Component } from "@angular/core";
import { GlobalVarsService } from "../global-vars.service";

@Component({
  selector: "free-deso-message",
templateUrl: "./free-deso-message.component.html",
})
export class FreeDesoMessageComponent {
  constructor(public globalVars: GlobalVarsService) {}
}
