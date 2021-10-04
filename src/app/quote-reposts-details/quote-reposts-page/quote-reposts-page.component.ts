import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";

@Component({
  selector: "quote-reposts-page",
  templateUrl: "./quote-reposts-page.component.html",
})
export class QuoteRepostsPageComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService) {}
}
