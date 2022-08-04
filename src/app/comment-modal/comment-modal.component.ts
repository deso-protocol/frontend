import { Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'comment-modal',
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.scss'],
})
export class CommentModalComponent {
  @Input() parentPost;
  @Input() afterCommentCreatedCallback: any = null;
  @Input() isQuote = false;

  constructor(public bsModalRef: BsModalRef) {}
}
