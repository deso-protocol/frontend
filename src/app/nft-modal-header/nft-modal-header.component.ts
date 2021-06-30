import { Component, OnInit, Input } from '@angular/core';
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: 'nft-modal-header',
  templateUrl: './nft-modal-header.component.html',
})
export class NftModalHeaderComponent implements OnInit {
  @Input() header: string;
  @Input() bsModalRef: BsModalRef;

  constructor() { }

  ngOnInit(): void {
  }

}
