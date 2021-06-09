
import { Component, Input } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "comment-modal",
  templateUrl: "./comment-modal.component.html",
  styleUrls: ["./comment-modal.component.scss"],
})
export class CommentModalComponent {
  @Input() parentPost;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() isQuote = false;
  
  ngOnInit() {
    if (localStorage.getItem("theme") == "light") {
      this.bsModalRef.setClass('lightmodal');
    } else {
      this.bsModalRef.setClass('darkmodal');
    }
  }

  constructor(public bsModalRef: BsModalRef) {}
}
