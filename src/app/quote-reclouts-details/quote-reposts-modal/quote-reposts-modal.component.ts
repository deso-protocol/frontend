import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "quote-reposts-modal",
  templateUrl: "./quote-reposts-modal.component.html",
})
export class QuoteRepostsModalComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService, public bsModalRef: BsModalRef) {}
}
