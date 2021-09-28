import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "diamonds-page",
  templateUrl: "./diamonds-modal.component.html",
})
export class DiamondsModalComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService, public bsModalRef: BsModalRef) {}
}
