import { Component, Input } from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import {BsModalRef} from "ngx-bootstrap/modal";

@Component({
  selector: "likes-modal",
  templateUrl: "./likes-modal.component.html",
})
export class LikesModalComponent {
  @Input() postHashHex: string;

  constructor(public globalVars: GlobalVarsService, public bsModalRef: BsModalRef) {}
}
