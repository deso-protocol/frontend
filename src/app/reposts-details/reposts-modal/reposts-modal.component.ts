import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "reposts-page",
  templateUrl: "./reposts-modal.component.html",
})
export class RepostsModalComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService, public bsModalRef: BsModalRef) {}
}
