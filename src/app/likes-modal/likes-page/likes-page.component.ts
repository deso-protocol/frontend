import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "likes-page",
  templateUrl: "./likes-page.component.html",
})
export class LikesPageComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService) {}
}
