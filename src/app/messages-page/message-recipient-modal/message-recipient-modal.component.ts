import {Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { GlobalVarsService } from "../../global-vars.service";
import {BsModalRef} from "ngx-bootstrap/modal";

@Component({
  selector: "message-recipient-modal",
  templateUrl: "./message-recipient-modal.component.html",
  styleUrls: ["./message-recipient-modal.component.scss"],
})
export class MessageRecipientModalComponent {
  @Output() userSelected = new EventEmitter();
  constructor(public globalVars: GlobalVarsService, public bsModalRef: BsModalRef) {}
  _handleCreatorSelectedInSearch(event) {
    this.userSelected.emit(event);
    this.bsModalRef.hide();
  }
}
