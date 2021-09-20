import {Component, Input, OnInit} from "@angular/core";
import {BsModalRef, BsModalService} from "ngx-bootstrap/modal";
import {PostEntryResponse} from "../../backend-api.service";

@Component({
  selector: "place-bid-modal",
  templateUrl: "./place-bid-modal.component.html",
  styleUrls: ["./place-bid-modal.component.scss"],
})
export class PlaceBidModalComponent {
  isLeftBarMobileOpen: boolean = false;
  title: string = null;
  @Input() postHashHex: string;
  @Input() post: PostEntryResponse;

  constructor(private bsModalRef: BsModalRef, private modalService: BsModalService) {}

  closeModal() {
    this.bsModalRef.hide();
  }

  closeModalEvent(event) {
    console.log(event);
    if (event) {
      this.modalService.setDismissReason(event);
    }
    this.bsModalRef.hide();
  }
}
